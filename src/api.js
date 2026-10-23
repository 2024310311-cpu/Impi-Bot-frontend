import axios from 'axios';
import { REQUEST_TIMEOUT_MS } from './search-contract.js';
export { checkedSearch, errorMessage } from './search-contract.js';

// Includes room for Render's cold start plus the bot's 65-second search budget.
export const api = axios.create({ baseURL: 'https://impi-bot.onrender.com', timeout: REQUEST_TIMEOUT_MS });
