import { gr } from './src/background/core.js';
import { handleMessage } from './src/background/handlers.js';

chrome.runtime.onMessage.addListener(handleMessage);

gr.start();
