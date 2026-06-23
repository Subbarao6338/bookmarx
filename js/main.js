import { STATE } from './state.js';
import { Core } from './core.js';
import { UI } from './ui.js';
import { Tools, PageTools } from './tools.js';

window.STATE = STATE;
window.Core = Core;
window.UI = UI;
window.Tools = Tools;
window.PageTools = PageTools;

Core.init();
