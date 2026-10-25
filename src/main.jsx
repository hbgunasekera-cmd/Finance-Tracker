import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import App from './App.jsx';

// Expose the client libraries expected by the existing finance engine.
window.supabase = { createClient };
window.bcrypt = bcrypt;

createRoot(document.getElementById('root')).render(<App />);
