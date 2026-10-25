const supa = supabase.createClient('https://hskramdwzubiteautnkw.supabase.co', 'sb_publishable_cPy4XEg_f2eQEo0N-3UMyg_qX4nDtF8');

            let reportData = [];
            let txs = [], conf = {}, vehs = [], bal = {}, filteredTxs = [], physAssets = [], loans = [];

            const CATS = {
                Income: {
                    "Salary": ["Monthly Base","Allowance", "Overtime", "Bonus"],
                    "Freelance": ["Web Development", "Consulting"],
                    "Ride-Hailing": [
                        "Uber Fares",
                        "PickMe Fares",
                        "Customer Tips"
                    ],
                    "Claims & Refunds": ["Broadband Claim", "Medical Refund", "Insurance Claim"],
                    "Gifts": ["Personal", "Foreign Transaction"],
                    "Other": ["Dividends", "Interest", "General"],
                    "Debt & Finance": ["Loan (Borrowing)", "Debt Collection"]
                },
                Expense: {
                    "Home Use": ["Monthly House Expense", "Mother", "Father", "Grocery & Essentials"],
                    "Maintenance & Utilities": ["Utilities (Water/Elec)", "Furniture/Hardware", "Home Repairs"],
                    "Foods & Beverages": [
                        "Breakfast",
                        "Lunch",
                        "Dinner",
                        "Snack",
                        "Bakery & Biscuits",
                        "Desserts & Sweets",
                        "Drinks",
                        "Fruits & Vegetables",
                        "Dairy & Eggs",
                        "Pantry Staples"
                    ],
                    "Transportation": [
                        "Fuel",
                        "Service & Repairs",
                        "Legal (Insurance/Rev)",
                        "Commuting (Bus/Train)",
                        "Parking"
                    ],
                    "Platform & Service Fees": [
                        "Uber Commission",
                        "PickMe Commission",
                        "Freelance Platform Fees",
                        "Agency Fees"
                    ],
                    "Telecommunication": ["Mobile Reload", "Internet/Data Bundle", "Cable TV"],
                    "Trips & Travel": [
                        "Group Trip Pool",
                        "Site Entry Tickets",
                        "Parking & Storage",
                        "Guide & Activity Fees"
                    ],
                    "Entertainment & Events": [
                        "Movie Tickets",
                        "Festivals & Shows",
                        "Hobbies & Leisure"
                    ],
                    "Social & Gifting": [
                        "Get-Together Pool",
                        "Gifts & Cash Presents"
                    ],
                    "Digital & Subscriptions": [
                        "Cloud Storage",
                        "Media & Streaming",
                        "Social Premium",
                        "Software & Apps"
                    ],
                    "Developer Infrastructure": [
                        "Domains & DNS",
                        "Cloud Hosting",
                        "Databases & Backend",
                        "APIs & AI Services",
                        "Dev Tools & Repos",
                        "Ads & Marketing"
                    ],
                    "Healthcare": ["Medicine", "Doctor Visit", "Supplement", "Hospital Bill"],
                    "Fashion & Grooming": ["Wearable", "Cosmetics", "Grooming/Salon", "Top Wear", "Bottom Wear", "Underwear", "Footwear"],
                    "Material & Chemicals": ["Tools", "Accessories", "Gadgets", "Chemicals"],
                    "Education": ["Courses", "Books", "Certifications"],
                    "Debt & Finance": ["Loan Repayment", "Lending", "Pawn Interest", "Bank Charges", "Credit Card", "Gifts"]
                }
            };


            window.validateLogin = async function () {
                const userInp = document.getElementById('loginUser').value.trim();
                const passInp = document.getElementById('loginPass').value.trim();
                const btn = document.getElementById('loginBtn');

                // Identify the bcrypt library correctly
                const bcryptLib = window.bcrypt || (window.dcodeIO && window.dcodeIO.bcrypt);

                if (!bcryptLib) {
                    showLoginError("Security library still loading... please wait 2 seconds.");
                    return;
                }

                if (!userInp || !passInp) {
                    showLoginError("Please fill all fields");
                    return;
                }

                btn.innerText = "Authenticating...";
                btn.disabled = true;

                try {
                    const { data, error } = await supa
                        .from('User_Credentials')
                        .select('password')
                        .eq('username', userInp)
                        .single();

                    if (error || !data) {
                        showLoginError("Invalid Username");
                        resetLoginBtn(btn);
                        return;
                    }

                    // Use the identified library to compare
                    const isValid = bcryptLib.compareSync(passInp, data.password);

                    if (isValid) {
                        document.getElementById('loginOverlay').style.display = 'none';
                        load();
                    } else {
                        showLoginError("Invalid Password");
                        resetLoginBtn(btn);
                    }
                } catch (err) {
                    console.error("Login System Error:", err);
                    resetLoginBtn(btn);
                    showLoginError("Connection Error");
                }
            }

            function resetLoginBtn(btn) {
                btn.innerText = "Unlock Access";
                btn.disabled = false;
                btn.style.opacity = "1";
            }

            function showLoginError(message) {
                const err = document.getElementById('loginError');
                err.innerText = message;
                err.style.display = 'block';
                // Shake effect
                err.parentElement.style.animation = "shake 0.2s ease-in-out 0s 2";
            }

            (() => {
                const overlay = document.getElementById('loginOverlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                }
                sessionStorage.removeItem('isVaultUnlocked');
                // Initialize date inputs after React has mounted the existing app markup.
                const today = new Date().toISOString().split('T')[0];
                ['eDate', 'tDate', 'aDate'].forEach(id => {
                    if (document.getElementById(id)) document.getElementById(id).value = today;
                });
            })();

            async function updateCredentials() {
                const hasher = window.bcrypt || (window.dcodeIO && window.dcodeIO.bcrypt);
                const oldPassEl = document.getElementById('oldPass');
                const newPassEl = document.getElementById('newPass');

                // Safety Check: Ensure UI elements exist
                if (!oldPassEl || !newPassEl) return msg("UI Error: Input fields missing");

                try {
                    // 1. Fetch the hash directly from the database
                    const { data, error } = await supa
                        .from('User_Credentials')
                        .select('password')
                        .eq('id', 1)
                        .single();

                    // 2. Audit: Check for 'password' instead of 'val'
                    if (error || !data || !data.password) {
                        console.error("Audit Error: System password record (hash) is missing from DB.");
                        return msg("Error: system password record not found");
                    }

                    const storedHash = data.password; // Changed from data.val to data.password
                    const userInput = oldPassEl.value;

                    // 3. Perform comparison (Both are now guaranteed to be strings)
                    const isMatch = hasher.compareSync(userInput, storedHash);

                    if (!isMatch) {
                        return msg("Current password incorrect");
                    }

                    // 4. Hash and Update the new password
                    const salt = hasher.genSaltSync(10);
                    const newHash = hasher.hashSync(newPassEl.value, salt);

                    const { updateError } = await supa
                        .from('User_Credentials')
                        .update({ password: newHash })
                        .eq('id', 1);

                    if (updateError) throw updateError;

                    msg("Credentials updated successfully");
                    oldPassEl.value = '';
                    newPassEl.value = '';

                } catch (e) {
                    console.error("Security Engine Error:", e);
                    msg("Update failed: Illegal arguments prevented");
                }
            }












            // --- CORE ENGINE & LOAD ---

            async function load() {
                try {
                    // 1. Parallel Fetch
                    const [resConf, resTxs, resVehs, resAssets, resLoans] = await Promise.all([
                        supa.from('Config').select('*').single(),
                        supa.from('Transaction_Records').select('*').order('Date', { ascending: false }),
                        supa.from('Vehicles').select('*'),
                        supa.from('Physical_Assets').select('*'),
                        supa.from('Finance_Management').select('*').eq('Status', 'Active')
                    ]);

                    // 2. Global Sync
                    conf = resConf.data || {};
                    txs = resTxs.data || [];
                    vehs = resVehs.data || [];
                    physAssets = resAssets.data || [];
                    loans = resLoans.data || [];

                    // 3. UI and Logic Trigger
                    updateDateFilters();

                    // This ensures variables are ready before render functions fire
                    calculate();

                    renderDashboard();
                    renderVehicles();
                    renderPhysicalAssets();
                    renderLoanStatus();
                    updateLenderSuggestions();

                    // Refresh active tab views
                    const analysisActive = document.getElementById('analysis')?.classList.contains('active');
                    const statsActive = document.getElementById('stats')?.classList.contains('active');

                    if (analysisActive) runProAnalysis();
                    if (statsActive) runReport();

                } catch (err) {
                    console.error("Critical Load Error:", err);
                    msg("Sync Failed. Check Console.");
                }
            }

            function calculate() {
                // 1. Establish Initial Baselines from Config
                bal = {
                    Main: parseFloat(conf.Main_Balance || 0),
                    Saving: parseFloat(conf.Saving_Balance || 0),
                    CC: parseFloat(conf.CCS || 0),
                    Crypto: (parseFloat(conf.Crypto_Balance || 0) * parseFloat(conf.Rate || 0))
                };

                const curMonth = new Date().toISOString().slice(0, 7);
                let mainStartBalance = bal.Main;
                let mainMonthlyExpense = 0;

                // 2. Adjust for ALL Transactions (Ledger Logic)
                txs.forEach(t => {
                    const a = parseFloat(t.Amount || 0);

                    // FIX: Removed "if (t.Account === 'Crypto') return" to allow ledger updates
                    const accMap = {
                        "Main": "Main",
                        "Saving": "Saving",
                        "Credit Card": "CC",
                        "Crypto": "Crypto" // Added Crypto to map
                    };
                    const key = accMap[t.Account];

                    if (key && bal[key] !== undefined) {
                        t.Type === 'Income' ? bal[key] += a : bal[key] -= a;

                        // Monthly Main Account Tracking
                        if (t.Account === "Main") {
                            if (t.Date.startsWith(curMonth)) {
                                if (t.Type === "Expense") mainMonthlyExpense += a;
                            } else {
                                // Pre-current month transactions define the "Starting Pool"
                                t.Type === 'Income' ? mainStartBalance += a : mainStartBalance -= a;
                            }
                        }
                    }
                });

                // 3. Loan & Lending Module
                let totalLent = 0;    // Money owed to you (Asset)
                let totalBorrowed = 0; // Money you owe (Liability)
                loans.forEach(l => {
                    const val = parseFloat(l.Amount || 0);
                    l.Type === 'Lending' ? totalLent += val : totalBorrowed += val;
                });

                // 4. Net Worth Math
                const ccLimit = parseFloat(conf.CCL || 0);
                const ccDebt = Math.max(0, ccLimit - bal.CC);

                // Total Cash available right now (Includes Crypto ledger updates)
                const totalCash = bal.Main + bal.Saving + bal.Crypto;
                // Total Debt (CC + Loans)
                const totalLiabilities = ccDebt + totalBorrowed;

                // Net Worth Calculation
                const liquid = (totalCash + totalLent) - totalLiabilities;
                const physical = physAssets.reduce((s, a) => s + getDepreciatedValue(a), 0);
                const total = liquid + physical;

                // 5. Update UI Numbers
                const setVal = (id, val) => {
                    if (document.getElementById(id)) document.getElementById(id).innerText = Math.round(val).toLocaleString();
                };
                setVal('vMain', bal.Main);
                setVal('vSave', bal.Saving);
                setVal('vCC', bal.CC);
                setVal('vCry', bal.Crypto);
                setVal('netVal', total);

                // 6. Update Dashboard Rings

                // Ring 1: LIQUIDITY (Gold) - Cash vs Debt
                const liquidityPct = ((totalCash - totalLiabilities) / Math.max(totalCash, 1)) * 100;
                updateRing('overallRing', 'overallPct', liquidityPct);

                // Ring 2: ASSETS (Purple) - Physical Ratio
                // FIX: Using Math.abs(total) or floor to ensure negative net worth doesn't break SVG
                const assetBase = Math.max(Math.abs(total), 1);
                updateRing('assetRing', 'assetPct', (physical / assetBase) * 100);

                // Ring 3: AVAILABLE (Green) - Monthly Main Budget
                const monthRemaining = mainStartBalance - mainMonthlyExpense;
                const remainingPct = (monthRemaining / Math.max(mainStartBalance, 1)) * 100;
                updateRing('monthRing', 'monthPct', remainingPct);
            }

            function updateRing(id, textId, pct) {
                const ring = document.getElementById(id);
                const text = document.getElementById(textId);

                // Allow pct to go above 100 or below 0 for calculation, but clamp for visual
                const safePct = Math.max(0, Math.min(100, isNaN(pct) ? 0 : pct));

                if (ring) {
                    const circumference = 100; // Assumes pathLength="100" in SVG
                    const offset = circumference - (safePct / 100) * circumference;
                    ring.style.strokeDasharray = circumference;
                    ring.style.strokeDashoffset = offset;
                }

                if (text) text.innerText = Math.round(pct) + '%';
            }

            function renderSubPie(txList, chartId, legendId) {
                const expenses = txList.filter(t => t.Type === 'Expense');
                const total = expenses.reduce((s, t) => s + (+t.Amount), 0);
                const subCats = {};

                // Aggregate by Subcategory
                expenses.forEach(t => {
                    subCats[t.Subcategory] = (subCats[t.Subcategory] || 0) + (+t.Amount);
                });

                // CHANGE: Increased slice from 5 to 9 to allow all your new digital subcategories to render
                const sorted = Object.entries(subCats).sort((a, b) => b[1] - a[1]);
                const top = sorted.slice(0, 9);

                // CHANGE: Trigger "Others" only if you exceed 9 subcategories
                if (sorted.length > 9) {
                    const otherSum = sorted.slice(9).reduce((s, x) => s + x[1], 0);
                    top.push(["Others", otherSum]);
                }

                // CHANGE: Expanded color palette from 6 colors to 10 distinct colors
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#64748b'];

                let gradient = [];
                let currentPct = 0;
                let legendHtml = '';

                top.forEach((item, i) => {
                    const pct = (item[1] / total) * 100;
                    const color = colors[i];
                    gradient.push(`${color} ${currentPct}% ${currentPct + pct}%`);
                    currentPct += pct;

                    legendHtml += `
        <div class="legend-item">
            <div class="legend-color" style="background:${color}"></div>
            <span>${item[0]}</span>
            <div class="legend-pct">${Math.round(pct)}%</div>
        </div>`;
                });

                const chartEl = document.getElementById(chartId);
                if (chartEl) chartEl.style.background = total > 0 ? `conic-gradient(${gradient.join(', ')})` : 'var(--border)';
                document.getElementById(legendId).innerHTML = total > 0 ? legendHtml : '<center style="grid-column: span 2;">No Data</center>';
            }

            // --- NAVIGATION ---

            function nav(id, btn) {
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(id).classList.add('active');
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                if (btn) btn.classList.add('active');

                const titles = { 'dash': 'Overview', 'entry': 'Activity', 'analysis': 'Engine', 'assets': 'Assets', 'stats': 'Reports', 'setup': 'Setup' };
                document.getElementById('vTitle').innerText = titles[id] || 'Finance';

                if (id !== 'dash') clearForms();

                // FIXED: Reset filters to current month when entering Stats
                if (id === 'stats') {
                    const now = new Date();
                    const curYear = now.getFullYear().toString();
                    const curMonth = "-" + (now.getMonth() + 1).toString().padStart(2, '0') + "-";

                    if (document.getElementById('fYear')) document.getElementById('fYear').value = curYear;
                    if (document.getElementById('fMonth')) document.getElementById('fMonth').value = curMonth;

                    runReport();
                }

                if (id === 'analysis') runProAnalysis();
                load();
            }

            function switchEntryTab(mode) {
                const isTx = mode === 'tx';
                document.getElementById('formTx').style.display = isTx ? 'block' : 'none';
                document.getElementById('formTf').style.display = isTx ? 'none' : 'block';

                document.getElementById('tabTx').style.background = isTx ? 'var(--primary)' : 'transparent';
                document.getElementById('tabTx').style.color = isTx ? 'white' : 'var(--sub)';
                document.getElementById('tabTf').style.background = isTx ? 'transparent' : 'var(--primary)';
                document.getElementById('tabTf').style.color = isTx ? 'var(--sub)' : 'white';
            }

            // --- FORM & TRANSACTION LOGIC ---

            function loadCats() {
                const type = document.getElementById('eType').value;
                const catSelect = document.getElementById('eCat');
                if (!CATS[type]) return;
                catSelect.innerHTML = Object.keys(CATS[type]).map(c => `<option>${c}</option>`).join('');
                loadSubs();
            }

            // 1. Updated loadSubs to initialize the specialized logic
            function loadSubs() {
                const type = document.getElementById('eType').value;
                const cat = document.getElementById('eCat').value;
                const subSelect = document.getElementById('eSub');
                if (!CATS[type][cat]) return;

                subSelect.innerHTML = CATS[type][cat].map(s => `<option>${s}</option>`).join('');

                // Trigger the toggle logic immediately when category changes
                toggleSpecialBoxes();
            }

            async function toggleSpecialBoxes() {
                const type = document.getElementById('eType').value;
                const cat = document.getElementById('eCat').value;
                const sub = document.getElementById('eSub').value;

                const vBox = document.getElementById('vehBox');
                const lBox = document.getElementById('lenderBox');

                // Handle Vehicle Box
                vBox.style.display = (cat === "Transportation" && sub !== "Commuting (Bus/Train)") ? "block" : "none";

                // Handle Lender/Borrower Box
                const isDebt = (cat === "Debt & Finance");
                const isLoanSub = (sub === "Loan (Borrowing)" || sub === "Loan Repayment" || sub === "Lending" || sub === "Debt Collection");

                if (isDebt && isLoanSub) {
                    lBox.style.display = "block";

                    // FIX: Use the 'neq' (Not Equal) filter or check for existence correctly
                    const { data, error } = await supa
                        .from('Finance_Management') // Ensure this matches your transaction table name
                        .select('Person_Name')
                        .not('Lender', 'is', null); // Ensure 'Lender' is capitalized if your column is

                    if (!error && data) {
                        const uniqueNames = [...new Set(data.map(item => item.Lender).filter(n => n))];
                        const list = document.getElementById('lenderSuggestions');
                        list.innerHTML = "";
                        uniqueNames.forEach(name => {
                            const opt = document.createElement('option');
                            opt.value = name;
                            list.appendChild(opt);
                        });
                    }
                } else {
                    lBox.style.display = "none";
                }
            }

            // 3. Updated Name Populator with Filter Support
            async function updateLenderSuggestions() {

                const list = document.getElementById('lenderSuggestions');
                let query = supa.from('Finance_Management')
                    .select('Person Name')
                    .eq('Status', 'Active');

                // Only filter by Borrowing/Lending if we are in a repayment/collection subcategory
                if (filterType) {
                    query = query.eq('Type', filterType);
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Supabase Error:", error);
                    return;
                }

                if (data && data.length > 0) {
                    // SAFETY CHECK: Filter out any nulls and ensure the property exists 
                    // to avoid "undefined" showing in the list
                    const uniqueNames = [...new Set(
                        data.filter(item => item && item.Person_Name)
                            .map(item => item.Person_Name)
                    )];

                    if (uniqueNames.length > 0) {
                        list.innerHTML = uniqueNames.map(name => `<option value="${name}">`).join('');
                    } else {
                        list.innerHTML = ''; // Clear list if no names match
                    }
                } else {
                    list.innerHTML = ''; // Clear list if no data found
                }

            }

            function checkLoanPrompt() {
                const type = document.getElementById('eType').value;
                const cat = document.getElementById('eCat').value;
                const sub = document.getElementById('eSub').value;

                // Show box if:
                // 1. Expense -> Lending
                // 2. Income -> Loan (Borrowing)
                // 3. Expense -> Loan Repayment (Optional, if you want to track repayments by name)
                const isLoan = (cat === "Debt & Finance" && (sub === "Lending" || sub === "Loan (Borrowing)"));

                document.getElementById('lenderBox').style.display = isLoan ? 'block' : 'none';
            }

            async function saveTx() {
                const date = document.getElementById('eDate').value;
                const acc = document.getElementById('eAcc').value;
                const type = document.getElementById('eType').value;
                const cat = document.getElementById('eCat').value;
                const sub = document.getElementById('eSub').value;
                const amt = parseFloat(document.getElementById('eAmt').value);
                let rem = document.getElementById('eRem').value;
                const vehicle = document.getElementById('eVeh').value;

                // Check if lender/person is from a dropdown or a "New" input field
                const personSelect = document.getElementById('eLender').value;
                const personNameInput = document.getElementById('newLenderName') ? document.getElementById('newLenderName').value.trim() : "";
                const person = personSelect === "New" ? personNameInput : personSelect;

                if (!amt || amt <= 0) return msg("Please enter a valid amount");

                const financeTriggers = ["Loan Repayment", "Lending", "Loan (Borrowing)", "Debt Collection"];
                if ((cat === "Debt & Finance") && financeTriggers.includes(sub) && !person) return msg("Please specify a person/lender");

                // Handle Vehicle Remarks for Transportation
                const vehicleTriggers = ["Fuel", "Service & Repairs", "Legal (Insurance/Rev)", "Parking"];
                if (cat === "Transportation" && vehicleTriggers.includes(sub)) {
                    if (vehicle) rem = rem ? `${vehicle} - ${rem}` : vehicle;
                }

                // 1. Record the primary Transaction
                const { error: txErr } = await supa.from('Transaction_Records').insert([{
                    Date: date,
                    Account: acc,
                    Type: type,
                    Category: cat,
                    Subcategory: sub,
                    Amount: amt,
                    Remark: rem
                }]);

                if (txErr) return msg("Transaction log failed");

                // 2. Update Finance Management (Loans/Lending/Debt)
                if (cat === "Debt & Finance" && person) {
                    let amountChange = 0;
                    let ledgerType = "";

                    const subCheck = sub.replace(/\s/g, '').toLowerCase();

                    // Logic for Borrowing (Loans taken from others)
                    if (type === "Income" && subCheck.includes("loan(borrowing)")) {
                        amountChange = amt;
                        ledgerType = "Borrowing";
                    }
                    else if (type === "Expense" && subCheck.includes("loanrepayment")) {
                        amountChange = -amt;
                        ledgerType = "Borrowing";
                    }
                    // Logic for Lending (Money given to others)
                    else if (type === "Expense" && subCheck === "lending") {
                        amountChange = amt;
                        ledgerType = "Lending";
                    }
                    else if (type === "Income" && subCheck.includes("debtcollection")) {
                        amountChange = -amt;
                        ledgerType = "Lending";
                    }

                    if (amountChange !== 0) {
                        // Check for existing active record for this person and type
                        const { data: existing, error: fetchErr } = await supa.from('Finance_Management')
                            .select('*')
                            .eq('Person_Name', person)
                            .eq('Type', ledgerType)
                            .eq('Status', 'Active')
                            .maybeSingle();

                        if (existing) {
                            // Update existing balance
                            const newBal = Math.max(0, existing.Amount + amountChange);
                            const { error: updErr } = await supa.from('Finance_Management').update({
                                Amount: newBal,
                                Status: newBal <= 0 ? 'Settled' : 'Active',
                                Last_Update: date
                            }).eq('id', existing.id);

                            if (updErr) console.error("Ledger Update Error:", updErr);
                        } else if (amountChange > 0) {
                            // Create a new record if it's a new loan or new lending
                            const { error: insErr } = await supa.from('Finance_Management').insert([{
                                Person_Name: person,
                                Amount: amt,
                                Type: ledgerType,
                                Date: date,
                                Category: 'Personal',
                                Status: 'Active',
                                Last_Update: date
                            }]);

                            if (insErr) console.error("Ledger Insert Error:", insErr);
                        }
                    }
                }

                msg("Entry Saved Successfully");
                clearForms();
                if (typeof load === "function") await load();
            }

            async function saveConf() {
                // 1. Get values from Setup/Baseline inputs
                const main = parseFloat(document.getElementById('cMain').value) || 0;
                const save = parseFloat(document.getElementById('cSave').value) || 0;
                const limit = parseFloat(document.getElementById('sCCL').value) || 0;  // CC Total Limit
                const spent = parseFloat(document.getElementById('sCCS').value) || 0;  // CC Current Spent
                const rate = parseFloat(document.getElementById('cRate').value) || 0;
                const crypto = parseFloat(document.getElementById('cCry').value) || 0;

                // 2. Logic: CCS (Available) = Total Limit - Current Spent at bank
                const available = limit - spent;

                const payload = {
                    Main_Balance: main,
                    Saving_Balance: save,
                    CCL: limit,      // Total Credit Limit
                    CCS: available,  // Available balance for the app to track
                    Rate: rate,
                    Crypto_Balance: crypto,
                    Budget: budget   // Dynamic goal for the dashboard ring
                };

                // 3. Update Supabase
                const { error } = await supa.from('Config').upsert({ id: 1, ...payload });

                if (error) {
                    console.error("Sync Error:", error);
                    msg("Sync Failed");
                } else {
                    msg("Baselines & Budget Synced");
                    await load(); // Trigger full recalculation and UI refresh
                }
            }

            async function delTx(id) {
                if (confirm("Delete this record permanently?")) {
                    await supa.from('Transaction_Records').delete().eq('id', id);
                    msg("Record Deleted");
                    load();
                }
            }

            async function doTransfer() {
                const from = document.getElementById('tFrom').value;
                const to = document.getElementById('tTo').value;
                const amt = parseFloat(document.getElementById('tAmt').value);
                const date = document.getElementById('tDate').value;

                if (!amt || isNaN(amt) || from === to) return msg("Invalid transfer details");

                // 1. Record Outgoing (Transfer Out)
                await supa.from('Transaction_Records').insert([{
                    Date: date, Account: from, Type: 'Expense', Category: 'Transfer', Subcategory: 'Transfer Out', Amount: amt, Remark: `To ${to}`
                }]);

                // 2. Record Incoming (Transfer In)
                await supa.from('Transaction_Records').insert([{
                    Date: date, Account: to, Type: 'Income', Category: 'Transfer', Subcategory: 'Transfer In', Amount: amt, Remark: `From ${from}`
                }]);

                msg("Transfer Completed");
                clearForms();
                load();
            }

            // --- ASSETS & VEHICLES CRUD ---

            async function addPhysicalAsset() {

                const payload = {
                    Name: document.getElementById('aName').value,
                    Value: parseFloat(document.getElementById('aVal').value),
                    Category: document.getElementById('aCat').value,
                    Specs: document.getElementById('aSpec').value,
                    Purchase_Date: document.getElementById('aDate').value // New Field
                };

                const name = document.getElementById('aName').value;
                const val = parseFloat(document.getElementById('aVal').value);
                const cat = document.getElementById('aCat').value;
                const spec = document.getElementById('aSpec').value;
                const pdate = document.getElementById('aDate').value;

                if (!name || !val) return msg("Name and Value required");

                const { error } = await supa.from('Physical_Assets').insert([{ Name: name, Value: val, Category: cat, Specs: spec, Purchase_Date: pdate }]);
                if (error) msg("Error adding asset");
                else { msg("Asset Added"); clearForms(); load(); }

            }

            async function delPhysAsset(id) {
                if (confirm("Delete Asset?")) {
                    await supa.from('Physical_Assets').delete().eq('id', id);
                    load();
                }
            }

            // Add this to your Global Script area
            function getDepreciatedValue(asset) {
                const originalValue = parseFloat(asset.Value || 0);
                const purchaseDate = new Date(asset.Purchase_Date || new Date());
                const today = new Date();

                // Calculate months owned
                const monthsOwned = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + (today.getMonth() - purchaseDate.getMonth());

                // Set General Defaults based on your existing HTML <select> options
                let lifespanYears = 5;
                let salvagePct = 0.10; // 10% scrap value

                if (asset.Category === "Electronics") { lifespanYears = 3; salvagePct = 0.10; }
                if (asset.Category === "Automobile") { lifespanYears = 10; salvagePct = 0.30; }
                if (asset.Category === "Furniture") { lifespanYears = 8; salvagePct = 0.05; }
                if (asset.Category === "Tools") { lifespanYears = 6; salvagePct = 0.05; }
                if (asset.Category === "Jewelry") { lifespanYears = 50; salvagePct = 0.95; } // Holds value

                const totalLifeMonths = lifespanYears * 12;
                const salvageValue = originalValue * salvagePct;

                // Straight-Line Math
                if (monthsOwned <= 0) return originalValue;
                if (monthsOwned >= totalLifeMonths) return salvageValue;

                const monthlyLoss = (originalValue - salvageValue) / totalLifeMonths;
                const currentValue = originalValue - (monthlyLoss * monthsOwned);

                return Math.max(currentValue, salvageValue);
            }

            async function addVehicle() {
                const reg = document.getElementById('vReg').value;
                const make = document.getElementById('vMake').value;
                if (!reg) return msg("Registration required");
                await supa.from('Vehicles').insert([{ Registration: reg, Model: make }]);
                msg("Vehicle Added");
                // Clear specific fields
                document.getElementById('vReg').value = '';
                document.getElementById('vMake').value = '';
                load();
            }

            async function delVehicle(id) {
                if (confirm("Delete Vehicle?")) {
                    await supa.from('Vehicles').delete().eq('id', id);
                    load();
                }
            }



            // --- ANALYSIS ENGINE (Pro) ---

            function runProAnalysis() {
                const year = document.getElementById('aYear').value;
                const month = document.getElementById('aMonth').value;

                // 1. Data Scoping
                // pData: Based on UI filters (Selected Month)
                const pData = txs.filter(t => {
                    return t.Date.startsWith(year) && (month === 'all' || t.Date.includes(month));
                });

                // currentMonthData: Actual calendar month (Current Month)
                const curMonthStr = new Date().toISOString().slice(0, 7);
                const currentMonthData = txs.filter(t => t.Date.startsWith(curMonthStr));

                // txs: All history (Overall)

                // 2. Financial Metrics
                const inc = pData.filter(t => t.Type === 'Income').reduce((s, t) => s + (+t.Amount), 0);
                const exp = pData.filter(t => t.Type === 'Expense').reduce((s, t) => s + (+t.Amount), 0);
                const saveRate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;

                // UI Updates (Metrics)
                document.getElementById('anSaveRate').innerText = Math.round(saveRate) + "%";
                document.getElementById('anSaveRate').style.color = saveRate > 20 ? 'var(--income)' : 'var(--expense)';

                const days = month === 'all' ? 365 : 30;
                document.getElementById('anBurn').innerText = Math.round(exp / days).toLocaleString();

                // 3. Efficiency Score Logic
                let score = Math.max(0, Math.min(100, Math.round(saveRate * 0.8 + 20)));
                if (inc === 0) score = 0;
                document.getElementById('proScore').innerText = score;
                document.getElementById('proStatus').innerText = score > 75 ? "ELITE GROWTH" : (score > 40 ? "STABLE" : "NEEDS ATTENTION");
                document.getElementById('proStatus').style.color = score > 75 ? "var(--income)" : (score > 40 ? "#fbbf24" : "var(--expense)");

                // 4. Concentration Chart (Category Bars)
                const cats = {};
                pData.filter(t => t.Type === 'Expense').forEach(t => cats[t.Category] = (cats[t.Category] || 0) + (+t.Amount));

                const chart = document.getElementById('anChart');
                chart.innerHTML = Object.keys(cats).sort((a, b) => cats[b] - cats[a]).slice(0, 5).map(c => {
                    const p = Math.round((cats[c] / exp) * 100);
                    return `
            <div style="margin-bottom:8px">
                <div style="display:flex; justify-content:space-between; font-size:11px;"><span>${c}</span><span>${p}%</span></div>
                <div style="width:100%; height:6px; background:var(--border); border-radius:4px;"><div style="width:${p}%; height:100%; background:var(--primary); border-radius:4px;"></div></div>
            </div>`;
                }).join('');

                // 5. Generate Insight
                const topCat = Object.keys(cats).sort((a, b) => cats[b] - cats[a])[0] || "None";
                document.getElementById('anInsights').innerHTML = `
        Spending <b>LKR ${exp.toLocaleString()}</b> vs Income <b>LKR ${inc.toLocaleString()}</b>. 
        Top expense is <b>${topCat}</b>. 
        ${saveRate < 20 ? "⚠️ Consider reducing discretionary spending." : "✅ Strong savings performance."}
    `;

                // 6. Daily Available Calculation
                const now = new Date();
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const today = now.getDate();
                const daysRemaining = (lastDay - today) + 1;

                const dailyTotal = (bal.Main + bal.Saving) / daysRemaining;
                const dailyMain = bal.Main / daysRemaining;
                const dailySave = bal.Saving / daysRemaining;

                const fmt = (n) => Math.max(0, n).toLocaleString(undefined, { maximumFractionDigits: 0 });
                document.getElementById('anDailyTotal').innerText = "LKR " + fmt(dailyTotal);
                document.getElementById('anDailyMain').innerText = "LKR " + fmt(dailyMain);
                document.getElementById('anDailySave').innerText = "LKR " + fmt(dailySave);
                document.getElementById('daysLeftNote').innerText = `Based on ${daysRemaining} days remaining this month`;

                // 7. --- PIE CHART SYSTEM ---
                // Big Chart (Top)
                renderSubPie(txs, 'pieAll', 'legendAll');

                // Small Charts (Bottom Side-by-Side)
                renderSubPie(pData, 'pieSelected', 'legendSelected');
                renderSubPie(currentMonthData, 'pieMonth', 'legendMonth');
            }

            // --- REPORTS ---

            function updateDateFilters() {


                if (txs.length === 0) return;

                // 1. Extract Unique Years
                const years = [...new Set(txs.map(t => t.Date.split('-')[0]))].sort((a, b) => b - a);

                // 2. Extract Unique Months (in -MM- format for the filter logic)
                const monthMap = {
                    "01": "January", "02": "February", "03": "March", "04": "April",
                    "05": "May", "06": "June", "07": "July", "08": "August",
                    "09": "September", "10": "October", "11": "November", "12": "December"
                };
                const months = [...new Set(txs.map(t => t.Date.split('-')[1]))].sort();

                // Populate Year Dropdowns
                const yearOptions = years.map(y => `<option value="${y}">${y}</option>`).join('');
                document.getElementById('fYear').innerHTML = `<option value="">All Years</option>` + yearOptions;
                document.getElementById('aYear').innerHTML = yearOptions; // Analysis usually needs a specific year

                // Populate Month Dropdowns
                const fMonthHtml = `<option value="">All Months</option>` +
                    months.map(m => `<option value="-${m}-">${monthMap[m]}</option>`).join('');

                const aMonthHtml = `<option value="all">Full Year View</option>` +
                    months.map(m => `<option value="-${m}-">${monthMap[m]}</option>`).join('');

                document.getElementById('fMonth').innerHTML = fMonthHtml;
                document.getElementById('aMonth').innerHTML = aMonthHtml;

                const today = new Date();
                const thisYear = today.getFullYear().toString();
                const thisMonth = "-" + (today.getMonth() + 1).toString().padStart(2, '0') + "-";

                document.getElementById('fYear').value = thisYear;
                document.getElementById('fMonth').value = thisMonth;
                document.getElementById('aYear').value = thisYear;
                document.getElementById('aMonth').value = thisMonth;


            }

            async function runReport() {
                // 1. Get UI Inputs
                const y = document.getElementById('fYear').value;
                const m = document.getElementById('fMonth').value;
                const t = document.getElementById('fType').value;
                const a = document.getElementById('fAcc').value;
                const k = document.getElementById('fKey').value.toLowerCase();

                // 2. Fetch Fresh Data from Supabase
                let { data, error } = await supa.from('Transaction_Records').select('*').order('Date', { ascending: false });
                if (error) return msg("Error loading data");

                // 3. Filter Logic (Consolidated Keywords)
                const filteredTxs = data.filter(x => {
                    const matchYear = !y || x.Date.startsWith(y);
                    const matchMonth = !m || x.Date.includes(m);
                    const matchType = !t || x.Type === t;
                    const matchAcc = !a || x.Account === a;
                    const matchKey = !k ||
                        (x.Remark || "").toLowerCase().includes(k) ||
                        (x.Subcategory || "").toLowerCase().includes(k) ||
                        (x.Category || "").toLowerCase().includes(k);

                    return matchYear && matchMonth && matchType && matchAcc && matchKey;
                });

                // Sync with Global variable for CSV Download
                reportData = filteredTxs;

                // 4. Calculate Global Totals
                const inc = filteredTxs.filter(x => x.Type === 'Income').reduce((s, x) => s + (+x.Amount), 0);
                const exp = filteredTxs.filter(x => x.Type === 'Expense').reduce((s, x) => s + (+x.Amount), 0);
                const globalNet = inc - exp;

                // 5. Monthly Forecast Logic (Visual Fixes Integrated)
                const now = new Date();
                const curYear = now.getFullYear().toString();
                const curMonth = "-" + (now.getMonth() + 1).toString().padStart(2, '0') + "-";
                const forecastEl = document.getElementById('monthlyForecastValue');

                if (forecastEl) {
                    forecastEl.classList.remove('pill-neutral', 'pill-positive', 'pill-negative');

                    if (y === curYear && m === curMonth) {
                        const dayOfMonth = now.getDate();
                        const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                        const projectedNet = (globalNet / dayOfMonth) * totalDaysInMonth;

                        const isPos = projectedNet >= 0;
                        forecastEl.classList.add(isPos ? 'pill-positive' : 'pill-negative');
                        forecastEl.innerText = (isPos ? "+ LKR " : "- LKR ") + Math.abs(Math.round(projectedNet)).toLocaleString();
                    } else {
                        forecastEl.classList.add('pill-neutral');
                        forecastEl.innerText = "N/A (Historical)";
                    }
                }

                // 6. Calculate Per-Account Net Balances
                const getAccNet = (accName) => {
                    const accTxs = filteredTxs.filter(x => x.Account === accName);
                    const aInc = accTxs.filter(x => x.Type === 'Income').reduce((s, x) => s + (+x.Amount), 0);
                    const aExp = accTxs.filter(x => x.Type === 'Expense').reduce((s, x) => s + (+x.Amount), 0);
                    return aInc - aExp;
                };

                const mainNet = getAccNet("Main");
                const saveNet = getAccNet("Saving");
                const ccNet = getAccNet("Credit Card");

                // 7. Update Summary UI (UX Style Fixes)
                const summaryBox = document.getElementById('reportSummary');
                if (summaryBox) {
                    summaryBox.style.display = 'block';
                    summaryBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                <span style="font-size:12px;">Global: <b style="color:var(--income)">+${inc.toLocaleString()}</b> | <b style="color:var(--expense)">-${exp.toLocaleString()}</b></span>
                <b id="repNet" style="color:${globalNet >= 0 ? 'var(--income)' : 'var(--expense)'}">Net: ${globalNet.toLocaleString()}</b>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; text-align:center;">
                <div><small class="label-sm">Main</small><br><b style="color:${mainNet >= 0 ? 'var(--income)' : 'var(--expense)'}">${mainNet.toLocaleString()}</b></div>
                <div><small class="label-sm">Saving</small><br><b style="color:${saveNet >= 0 ? 'var(--income)' : 'var(--expense)'}">${saveNet.toLocaleString()}</b></div>
                <div><small class="label-sm">CC Net</small><br><b style="color:${ccNet >= 0 ? 'var(--income)' : 'var(--expense)'}">${ccNet.toLocaleString()}</b></div>
            </div>
        `;
                }

                // 8. Render Transaction List
                const listBody = document.getElementById('reportList');
                if (listBody) {
                    listBody.innerHTML = filteredTxs.length ? filteredTxs.map(x => `
            <div class="list-item" style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border); font-size:12px;">
                <div>
                    <b style="color:var(--text)">${x.Subcategory}</b><br>
                    <small style="color:var(--sub)">${x.Date} • ${x.Account}</small>
                </div>
                <div style="text-align:right">
                    <div style="font-weight:800; color:${x.Type === 'Income' ? 'var(--income)' : 'var(--expense)'}">
                        ${x.Type === 'Income' ? '+' : '-'}${parseFloat(x.Amount).toLocaleString()}
                    </div>
                    <small style="color:var(--sub)">${x.Remark || ''}</small>
                </div>
            </div>
        `).join('') : "<center style='padding:20px;'><small style='color:var(--sub)'>No records found for these filters.</small></center>";
                }
            }

            async function exportCSV() {
                if (!reportData || reportData.length === 0) {
                    return msg("No data available to export. Run a report first.");
                }

                const headers = ["Date", "Account", "Type", "Category", "Subcategory", "Amount", "Remark", "Person"];
                const rows = reportData.map(tx => [
                    tx.Date,
                    `"${tx.Account}"`,
                    tx.Type,
                    `"${tx.Category}"`,
                    `"${tx.Subcategory}"`,
                    tx.Amount,
                    `"${tx.Remark || ''}"`,
                    `"${tx.Person_Name || ''}"`
                ].join(","));

                const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Finance_Export_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                msg("CSV Downloaded");
            }

            function renderDashboard() {
                const list = document.getElementById('recentList');
                if (!list) return;

                // Show top 5 recent transactions
                const recent = txs.slice(0, 5);

                if (recent.length === 0) {
                    list.innerHTML = "<center><small style='color:var(--sub)'>No recent activity</small></center>";
                    return;
                }

                list.innerHTML = recent.map(x => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border);">
            <div style="flex:1;">
                <b style="font-size:13px;">${x.Subcategory}</b><br>
                <small style="color:var(--sub); font-size:10px;">${x.Date} • ${x.Account}</small>
            </div>
            <div style="text-align:right; margin-right:10px;">
                <div style="font-weight:800; font-size:14px; color:${x.Type === 'Income' ? 'var(--income)' : 'var(--expense)'}">
                    ${x.Type === 'Income' ? '+' : '-'}${Math.round(x.Amount).toLocaleString()}
                </div>
                <small style="color:var(--sub); font-size:9px; text-transform:uppercase;">${x.Category}</small>
            </div>
            <button onclick="delTx('${x.id}')" class="btn-del" style="height:28px; width:28px; background:none; border:none; color:var(--expense); cursor:pointer; font-size:18px;">×</button>
        </div>
    `).join('');
            }

            function renderLoanStatus() {

                const container = document.getElementById('loanStatusList');
                // Only display 'Active' status records to keep dashboard clean
                const activeLoans = loans.filter(l => l.Status === 'Active');

                if (activeLoans.length === 0) {
                    container.innerHTML = "<small style='color:var(--sub)'>No active debts or Lending.</small>";
                    return;
                }

                container.innerHTML = activeLoans.map(l => {
                    // Logic to determine Color and Label
                    const isLending = l.Type === 'Lending'; // You gave money (Asset)

                    // Lending = Green (Incoming Future), Borrowing = Red (Outgoing Future)
                    const color = isLending ? 'var(--income)' : 'var(--expense)';
                    const label = isLending ? 'TO COLLECT' : 'TO PAY';
                    const arrow = isLending ? 'High' : 'Low'; // Visual cue

                    return `
            <div style="padding: 12px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <b style="font-size: 14px;">${l.Person_Name}</b><br>
                    <small style="color: ${color}; font-weight:700; font-size: 10px; border: 1px solid ${color}; padding: 2px 6px; border-radius: 6px; margin-top: 4px; display:inline-block;">
                        ${label}
                    </small>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 800; font-size: 15px; color: ${color};">
                        LKR ${Math.round(l.Amount).toLocaleString()}
                    </div>
                    <small style="font-size: 10px; color: var(--sub);">
                        ${l.Due_Date ? 'Due: ' + l.Due_Date : 'Active'}
                    </small>
                </div>
            </div>
        `;
                }).join('');
            }

            function renderPhysicalAssets() {
                const list = document.getElementById('assetList');

                // Calculate depreciated total for the header
                const depTotal = physAssets.reduce((s, a) => s + getDepreciatedValue(a), 0);
                document.getElementById('totalAssetVal').innerText = "LKR " + depTotal.toLocaleString();

                list.innerHTML = physAssets.map(a => {
                    const currentVal = getDepreciatedValue(a);
                    const originalVal = parseFloat(a.Value || 0);
                    const healthPct = Math.round((currentVal / originalVal) * 100);

                    return `
            <div class="card" style="margin-bottom:12px; padding:15px; border:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <label class="label-sm">${a.Category}</label>
                        <b style="font-size:14px;">${a.Name}</b><br>
                        <small style="color:var(--sub)">${a.Specs || 'No Specs'}</small>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:800; color:var(--primary);">LKR ${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <small style="color:var(--sub); text-decoration: line-through;">LKR ${originalVal.toLocaleString()}</small>
                    </div>
                </div>
                
                <div style="margin-top:10px;">
                    <div style="width:100%; height:4px; background:var(--bg); border-radius:10px; overflow:hidden; border:1px solid var(--border);">
                        <div style="width:${healthPct}%; height:100%; background:${healthPct > 50 ? 'var(--income)' : 'var(--expense)'};"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:9px; margin-top:4px; color:var(--sub); font-weight:700;">
                        <span>ASSET HEALTH</span>
                        <span>${healthPct}%</span>
                    </div>
                </div>
                <button onclick="delPhysAsset('${a.id}')" class="btn-del" style="margin-top:10px; width:100%; height:32px; border-radius:12px;">Remove Asset</button>
            </div>
        `;
                }).join('');
            }

            async function renderVehicles() {
                const vSelect = document.getElementById('eVeh');
                vSelect.innerHTML = '<option>Loading...</option>';

                try {
                    // Fetch from Supabase Vehicles table
                    const { data, error } = await supa
                        .from('Vehicles')
                        .select('Registration, Model');

                    if (error) throw error;

                    if (data && data.length > 0) {
                        vSelect.innerHTML = data.map(v =>
                            `<option value="${v.Registration}">${v.Registration} (${v.Model})</option>`
                        ).join('');
                    } else {
                        vSelect.innerHTML = '<option>No Vehicles Found</option>';
                    }
                } catch (err) {
                    console.error("Vehicle load error:", err);
                    // Fallback to your primary profile vehicles if DB fails
                    const fallback = ["BDD 0471 (Hornet)", "BGO 2270 (Dio)", "MK 1081 (Serow)"];
                    vSelect.innerHTML = fallback.map(v => `<option>${v}</option>`).join('');
                }
            }

            async function updateLenderSuggestions(currentTxType, subcategory) {
                const list = document.getElementById('lenderSuggestions');
                if (!list) return;

                // LOGIC: 
                // If 'Loan Repayment' (Expense) -> show people I 'Borrowed' from.
                // If 'Debt Collection' (Income) -> show people I 'Lent' to.
                let targetType = '';
                if (subcategory === "Loan Repayment") targetType = 'Borrowing';
                else if (subcategory === "Debt Collection") targetType = 'Lending';

                let query = supa.from('Finance_Management')
                    .select('Person_Name')
                    .eq('Status', 'Active');

                if (targetType) {
                    query = query.eq('Type', targetType);
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Supabase Fetch Error:", error);
                    return;
                }

                if (data && data.length > 0) {
                    // Filter out nulls and extract unique names to avoid "undefined"
                    const uniqueNames = [...new Set(
                        data.filter(item => item && item.Person_Name)
                            .map(item => item.Person_Name)
                    )];

                    list.innerHTML = uniqueNames.map(name => `<option value="${name}">`).join('');
                } else {
                    list.innerHTML = ''; // Reset if no active loans found
                }
            }

            // --- UTILS ---

            function clearForms() {
                const ids = ['eAmt', 'eRem', 'tAmt', 'aName', 'aVal', 'aSpec', 'eLender', 'vReg', 'vMake'];
                ids.forEach(id => { if (document.getElementById(id)) document.getElementById(id).value = ''; });
                document.getElementById('lenderBox').style.display = 'none';
                const today = new Date().toISOString().split('T')[0];
                ['eDate', 'tDate'].forEach(id => { if (document.getElementById(id)) document.getElementById(id).value = today; });
                loadCats();
            }

            function updateLive(accId, pillId) {
                const selection = document.getElementById(accId).value;
                const accMap = { "Main": "Main", "Saving": "Saving", "Credit Card": "CC", "Crypto": "Crypto" };

                const targetKey = accMap[selection] || selection;
                const amount = bal[targetKey] || 0;

                const pill = document.getElementById(pillId);
                pill.innerText = "LKR " + amount.toLocaleString();

                // Specific logic for Credit Card utilization warning
                if (selection === "Credit Card") {
                    const limit = parseFloat(conf.CCL || 0); // Credit Card Limit from setup
                    const usage = (limit - amount) / limit;
                    pill.style.color = usage > 0.8 ? 'var(--expense)' : 'var(--income)';
                } else {
                    pill.style.color = amount < 0 ? 'var(--expense)' : 'var(--income)';
                }
            }

            function msg(m) {
                const t = document.getElementById('toast');
                t.innerText = m; t.style.display = 'block';
                setTimeout(() => t.style.display = 'none', 2500);
            }

            function toggleTheme() {
                const r = document.documentElement;
                r.setAttribute('data-theme', r.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
            }

            // Initial Boot
            load();
