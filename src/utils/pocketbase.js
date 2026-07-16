import PocketBase from 'pocketbase';
import necsLinks from '../../data/necs_links.json';

/**
 * Checks connection to a PocketBase instance.
 * @param {string} url - PocketBase instance URL
 * @returns {Promise<boolean>}
 */
export async function testPBConnection(url) {
  try {
    const pb = new PocketBase(url);
    pb.autoCancellation(false);
    const health = await pb.health.check();
    return health.status === 200 || health.code === 200;
  } catch (error) {
    console.error('PocketBase health check failed:', error);
    return false;
  }
}

/**
 * Authenticates with a PocketBase instance if credentials are provided.
 * Supports superusers/admins and regular users.
 * @param {PocketBase} pb - PocketBase instance
 * @param {string} email - Email/Username
 * @param {string} password - Password
 * @param {boolean} isAdmin - Whether to authenticate as superuser/admin
 */
async function authenticate(pb, email, password, isAdmin) {
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedPassword = typeof password === 'string' ? password.trim() : '';
  if (!trimmedEmail || !trimmedPassword) {
    console.log('Skipping PocketBase authentication: Email or password is not provided.');
    return;
  }

  console.log(`Attempting PocketBase authentication for email: ${trimmedEmail} (as Admin: ${isAdmin})`);
  if (isAdmin) {
    try {
      // Try PocketBase modern _superusers collection first (v0.23+)
      await pb.collection('_superusers').authWithPassword(trimmedEmail, trimmedPassword);
      console.log('Successfully authenticated as superuser via _superusers collection.');
      return;
    } catch (e1) {
      console.warn('PocketBase _superusers collection authentication failed, trying legacy pb.admins:', e1.message);
      try {
        // Fallback to PocketBase legacy pb.admins if available on client and server
        if (pb.admins && typeof pb.admins.authWithPassword === 'function') {
          await pb.admins.authWithPassword(trimmedEmail, trimmedPassword);
          console.log('Successfully authenticated as legacy admin/superuser.');
          return;
        } else {
          throw new Error('Legacy pb.admins helper is not available in current PocketBase client SDK.');
        }
      } catch (e2) {
        console.warn('PocketBase legacy pb.admins authentication failed:', e2.message);
        throw new Error(`Admin/Superuser authentication failed. Modern error: [${e1.message}]. Legacy error: [${e2.message}].`);
      }
    }
  } else {
    try {
      await pb.collection('users').authWithPassword(trimmedEmail, trimmedPassword);
      console.log('Successfully authenticated as standard user via users collection.');
    } catch (error) {
      throw new Error(`Regular user authentication failed: ${error.message}`);
    }
  }
}

/**
 * Pushes local bookmarks to PocketBase.
 * @param {object} config - PB Config (url, collection, email, password, isAdmin)
 * @param {Array} localLinks - Array of local link objects
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function pushToPocketBase(config, localLinks) {
  const { url, collection = 'bookmarks', email, password, isAdmin = false } = config;
  if (!url) return { success: false, message: 'PocketBase URL is required' };

  try {
    const pb = new PocketBase(url);
    pb.autoCancellation(false);

    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedPassword = typeof password === 'string' ? password.trim() : '';
    if (trimmedEmail && trimmedPassword) {
      await authenticate(pb, trimmedEmail, trimmedPassword, isAdmin);
    } else {
      console.log('Skipping PocketBase authentication: Credentials are not provided.');
    }

    const pbCollection = pb.collection(collection);

    // Fetch existing records from PB to determine update vs create
    let existingRecords = [];
    try {
      existingRecords = await pbCollection.getFullList({
        fields: 'id,local_id,title,url'
      });
    } catch (err) {
      return {
        success: false,
        message: `Failed to fetch from collection "${collection}". Ensure the collection exists in PocketBase and has correct permissions.`
      };
    }

    const existingMap = new Map();
    existingRecords.forEach(rec => {
      if (rec.local_id) {
        existingMap.set(rec.local_id, rec.id);
      }
    });

    let createdCount = 0;
    let updatedCount = 0;

    for (const link of localLinks) {
      const data = {
        local_id: link.id,
        title: link.title || '',
        url: link.url || '',
        category: link.category || 'General',
        urls: Array.isArray(link.urls) ? link.urls : [link.url || ''],
        is_pinned: !!link.is_pinned,
        icon: link.icon || ''
      };

      const pbId = existingMap.get(link.id);
      if (pbId) {
        await pbCollection.update(pbId, data);
        updatedCount++;
      } else {
        await pbCollection.create(data);
        createdCount++;
      }
    }

    return {
      success: true,
      message: `Successfully pushed data! Created ${createdCount} and updated ${updatedCount} bookmarks.`
    };
  } catch (error) {
    console.error('PocketBase push error:', error);
    return { success: false, message: error.message || 'An error occurred during push.' };
  }
}

/**
 * Pulls bookmarks from PocketBase and merges them into local links.
 * @param {object} config - PB Config (url, collection, email, password, isAdmin)
 * @param {Array} currentLocalLinks - Array of current local link objects
 * @returns {Promise<{success: boolean, message: string, links?: Array}>}
 */
export async function pullFromPocketBase(config, currentLocalLinks) {
  const { url, collection = 'bookmarks', email, password, isAdmin = false } = config;
  if (!url) return { success: false, message: 'PocketBase URL is required' };

  try {
    const pb = new PocketBase(url);
    pb.autoCancellation(false);

    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedPassword = typeof password === 'string' ? password.trim() : '';
    if (trimmedEmail && trimmedPassword) {
      await authenticate(pb, trimmedEmail, trimmedPassword, isAdmin);
    } else {
      console.log('Skipping PocketBase authentication: Credentials are not provided.');
    }

    const pbCollection = pb.collection(collection);
    const pbRecords = await pbCollection.getFullList();

    if (!pbRecords || pbRecords.length === 0) {
      return { success: true, message: 'No bookmarks found in PocketBase to pull.', links: currentLocalLinks };
    }

    // Merge logic
    const mergedLinks = [...currentLocalLinks];

    pbRecords.forEach(rec => {
      const localId = rec.local_id || `l-necs-${rec.id}`;
      const existingIdx = mergedLinks.findIndex(l => l.id === localId);

      const parsedUrls = Array.isArray(rec.urls) ? rec.urls : (typeof rec.urls === 'string' ? JSON.parse(rec.urls || '[]') : [rec.url]);

      const linkObj = {
        id: localId,
        title: rec.title,
        url: rec.url,
        category: rec.category || 'General',
        urls: parsedUrls.length > 0 ? parsedUrls : [rec.url],
        is_pinned: !!rec.is_pinned,
        icon: rec.icon || null
      };

      if (existingIdx > -1) {
        mergedLinks[existingIdx] = linkObj;
      } else {
        mergedLinks.push(linkObj);
      }
    });

    return {
      success: true,
      message: `Successfully pulled and merged ${pbRecords.length} bookmarks from PocketBase.`,
      links: mergedLinks
    };
  } catch (error) {
    console.error('PocketBase pull error:', error);
    return { success: false, message: error.message || 'An error occurred during pull.' };
  }
}

/**
 * Seeds PocketBase from the default JSON file necs_links.json
 * @param {object} config - PB Config (url, collection, email, password, isAdmin)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function seedPocketBaseFromJson(config) {
  const links = necsLinks.map((l, index) => ({
    id: l.id || `l-necs-${index}-${Date.now()}`,
    ...l,
    is_pinned: l.is_pinned || false
  }));
  return pushToPocketBase(config, links);
}
