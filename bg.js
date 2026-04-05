import { gr } from './background/core.js';
import { handleMessage } from './background/handlers.js';

chrome.runtime.onMessage.addListener(handleMessage);

gr.start();
