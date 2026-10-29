const supa = supabase.createClient('https://hskramdwzubiteautnkw.supabase.co', 'sb_publishable_cPy4XEg_f2eQEo0N-3UMyg_qX4nDtF8');

            let reportData = [];
            let txs = [], conf = {}, vehs = [], bal = {}, filteredTxs = [], physAssets = [], loans = [];
            const locallyInsertedTransactions = new Map();
            const locallyInsertedOrder = new Map();
            let localInsertSequence = 0;

            function sortTransactions(records) {
                return records.slice().sort((left, right) => {
                    const dateOrder = String(validDateKey(right.Date) || '')
                        .localeCompare(String(validDateKey(left.Date) || ''));
                    if (dateOrder) return dateOrder;
                    return (locallyInsertedOrder.get(String(right.id)) || 0) -
                        (locallyInsertedOrder.get(String(left.id)) || 0);
                });
            }

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
                        "Agency Fees",
                        "Normal Postal Service", 
                        "Courier & Express",
                        "Registered Mail Service"
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
                    "Material & Chemicals": ["Tools", "Accessories", "Stationery & Office Supplies", "Gadgets", "Chemicals"],
                    "Education": ["Courses", "Books", "Certifications"],
                    "Debt & Finance": ["Loan Repayment", "Loan Interest", "Lending", "Pawn Interest", "Bank Charges", "Credit Card", "Gifts"]
                }
            };

            const ACCOUNT_KEYS = {
                Main: 'Main',
                Saving: 'Saving',
                'Credit Card': 'CC',
                Crypto: 'Crypto'
            };
            const MONTH_NAMES = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            function toNumber(value) {
                if (value === null || value === undefined || value === '') return 0;
                const number = Number(value);
                return Number.isFinite(number) ? number : 0;
            }

            function roundMoney(value) {
                const amount = toNumber(value);
                const rounded = Math.sign(amount) * Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
                return Object.is(rounded, -0) ? 0 : rounded;
            }

            function formatMoney(value, maximumFractionDigits = 2) {
                return new Intl.NumberFormat('en-LK', {
                    maximumFractionDigits,
                    minimumFractionDigits: 0
                }).format(roundMoney(value));
            }

            function validDateKey(value) {
                const key = typeof value === 'string' ? value.slice(0, 10) : '';
                if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
                const [year, month, day] = key.split('-').map(Number);
                const parsed = new Date(Date.UTC(year, month - 1, day));
                return parsed.getUTCFullYear() === year &&
                    parsed.getUTCMonth() === month - 1 &&
                    parsed.getUTCDate() === day ? key : null;
            }

            function todayDateKey(date = new Date()) {
                const parts = new Intl.DateTimeFormat('en', {
                    timeZone: 'Asia/Colombo',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).formatToParts(date);
                const part = type => parts.find(item => item.type === type)?.value || '';
                return `${part('year')}-${part('month')}-${part('day')}`;
            }

            function currentMonthKey(date = new Date()) {
                return todayDateKey(date).slice(0, 7);
            }

            function isMonthEndSalary(transaction) {
                const date = validDateKey(transaction?.Date);
                if (transaction?.Type !== 'Income' ||
                    String(transaction?.Category || '').trim().toLowerCase() !== 'salary' || !date) return false;

                const year = Number(date.slice(0, 4));
                const month = Number(date.slice(5, 7));
                return Number(date.slice(8, 10)) === daysInMonth(year, month);
            }

            function spendingPeriodMonth(transaction) {
                const date = validDateKey(transaction?.Date);
                if (!date) return null;
                if (!isMonthEndSalary(transaction)) return date.slice(0, 7);

                const nextMonth = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 1));
                return `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, '0')}`;
            }

            function transactionAmount(transaction) {
                // Amount is a magnitude; Type determines whether it adds to or subtracts from an account.
                return Math.abs(roundMoney(transaction?.Amount));
            }

            function isTransfer(transaction) {
                const category = String(transaction?.Category || '').trim().toLowerCase();
                const subcategory = String(transaction?.Subcategory || '').trim().toLowerCase();
                return category === 'transfer' || subcategory === 'transfer in' || subcategory === 'transfer out';
            }

            function isNonOperatingFlow(transaction) {
                if (isTransfer(transaction)) return true;
                return transaction?.Category === 'Debt & Finance' && [
                    'Loan (Borrowing)', 'Loan Repayment', 'Lending', 'Debt Collection'
                ].includes(transaction?.Subcategory);
            }

            function getIncomeExpense(records) {
                return records.reduce((totals, transaction) => {
                    if (isNonOperatingFlow(transaction)) return totals;
                    const amount = transactionAmount(transaction);
                    if (transaction.Type === 'Income') totals.income += amount;
                    if (transaction.Type === 'Expense') totals.expense += amount;
                    return totals;
                }, { income: 0, expense: 0 });
            }

            function escapeHtml(value) {
                return String(value ?? '').replace(/[&<>"']/g, character => ({
                    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
                })[character]);
            }

            function getLoanAdjustment(transaction) {
                if (transaction?.Category !== 'Debt & Finance') return null;
                const amount = transactionAmount(transaction);
                if (transaction.Type === 'Income' && transaction.Subcategory === 'Loan (Borrowing)') {
                    return { type: 'Borrowing', change: amount };
                }
                if (transaction.Type === 'Expense' && transaction.Subcategory === 'Loan Repayment') {
                    return { type: 'Borrowing', change: -amount };
                }
                if (transaction.Type === 'Expense' && transaction.Subcategory === 'Lending') {
                    return { type: 'Lending', change: amount };
                }
                if (transaction.Type === 'Income' && transaction.Subcategory === 'Debt Collection') {
                    return { type: 'Lending', change: -amount };
                }
                return null;
            }

            function daysInMonth(year, monthNumber) {
                return new Date(Number(year), Number(monthNumber), 0).getDate();
            }

            function daysInYear(year) {
                return new Date(Number(year), 1, 29).getMonth() === 1 ? 366 : 365;
            }

            function elapsedDaysInPeriod(yearValue, monthValue) {
                const today = todayDateKey();
                const year = Number(yearValue);
                if (!Number.isInteger(year) || year < 1 || `${year}`.padStart(4, '0') > today.slice(0, 4)) return 0;

                if (monthValue && monthValue !== 'all') {
                    const month = Number(String(monthValue).replace(/\D/g, ''));
                    if (!Number.isInteger(month) || month < 1 || month > 12) return 0;
                    const periodStart = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
                    if (periodStart > today) return 0;
                    return periodStart.slice(0, 7) === today.slice(0, 7)
                        ? Number(today.slice(8, 10))
                        : daysInMonth(year, month);
                }

                if (year === Number(today.slice(0, 4))) {
                    const yearStart = new Date(year, 0, 1);
                    const todayLocal = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
                    return Math.floor((todayLocal - yearStart) / 86400000) + 1;
                }
                return daysInYear(year);
            }

            function transactionsForPeriod(records, yearValue, monthValue, includeFuture = false) {
                const year = String(yearValue || '');
                const month = monthValue && monthValue !== 'all'
                    ? String(monthValue).replace(/\D/g, '').padStart(2, '0')
                    : null;
                const today = todayDateKey();
                return records.filter(transaction => {
                    const date = validDateKey(transaction.Date);
                    return date && date.startsWith(year) && (!month || date.slice(5, 7) === month) &&
                        (includeFuture || date <= today);
                });
            }

            function transactionsForSpendingPeriod(records, yearValue, monthValue, includeFuture = false) {
                const year = String(yearValue || '');
                const month = monthValue && monthValue !== 'all'
                    ? String(monthValue).replace(/\D/g, '').padStart(2, '0')
                    : null;
                const today = todayDateKey();
                return records.filter(transaction => {
                    const date = validDateKey(transaction.Date);
                    const spendingMonth = spendingPeriodMonth(transaction);
                    return date && spendingMonth && spendingMonth.startsWith(year) &&
                        (!month || spendingMonth.slice(5, 7) === month) &&
                        (includeFuture || date <= today);
                });
            }

            async function fetchAllRows(table, configureQuery = query => query.order('id', { ascending: true })) {
                const pageSize = 500;
                const rows = [];
                for (let start = 0; ; start += pageSize) {
                    const { data, error } = await configureQuery(supa.from(table).select('*'))
                        .range(start, start + pageSize - 1);
                    if (error) return { data: null, error };
                    rows.push(...(data || []));
                    if (!data || data.length < pageSize) return { data: rows, error: null };
                }
            }


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
                const today = todayDateKey();
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

            function syncConfigForm() {
                const fields = [
                    ['cMain', 'Main_Balance'], ['cSave', 'Saving_Balance'],
                    ['sCCL', 'CCL'], ['sCCS', 'CCS'], ['cRate', 'Rate'],
                    ['cCry', 'Crypto_Balance']
                ];
                fields.forEach(([inputId, configKey]) => {
                    const input = document.getElementById(inputId);
                    if (input) input.value = toNumber(conf[configKey]);
                });
            }

            async function load() {
                try {
                    const today = todayDateKey();
                    const [resConf, resTxs, resTodayTxs, resVehs, resAssets, resLoans] = await Promise.all([
                        supa.from('Config').select('*').maybeSingle(),
                        fetchAllRows('Transaction_Records', query => query.order('Date', { ascending: false }).order('id', { ascending: true })),
                        // Fetch today's rows independently so offset pagination on the full ledger
                        // cannot leave a same-day transaction out of the dashboard or current report.
                        fetchAllRows('Transaction_Records', query => query.eq('Date', today).order('id', { ascending: true })),
                        fetchAllRows('Vehicles'),
                        fetchAllRows('Physical_Assets'),
                        fetchAllRows('Finance_Management', query => query.eq('Status', 'Active').order('id', { ascending: true }))
                    ]);

                    if (resTxs.error) throw resTxs.error;
                    if (resTodayTxs.error) console.error('Today transaction refresh failed:', resTodayTxs.error);

                    if (resConf.error) {
                        console.error('Config load failed:', resConf.error);
                    } else {
                        conf = resConf.data || {};
                    }
                    const transactionsById = new Map();
                    for (const transaction of [...(resTxs.data || []), ...(resTodayTxs.data || [])]) {
                        transactionsById.set(String(transaction.id), transaction);
                    }
                    const loadedTransactions = [...transactionsById.values()];
                    const loadedTransactionIds = new Set(loadedTransactions.map(transaction => String(transaction.id)));
                    for (const [id, transaction] of locallyInsertedTransactions) {
                        if (!loadedTransactionIds.has(id)) {
                            loadedTransactions.push(transaction);
                        }
                    }
                    txs = sortTransactions(loadedTransactions);

                    if (resVehs.error) console.error('Vehicle load failed:', resVehs.error);
                    else vehs = resVehs.data || [];
                    if (resAssets.error) console.error('Physical asset load failed:', resAssets.error);
                    else physAssets = resAssets.data || [];
                    if (resLoans.error) console.error('Loan load failed:', resLoans.error);
                    else loans = resLoans.data || [];

                    syncConfigForm();
                    updateDateFilters();
                    calculate();
                    renderDashboard();
                    renderVehicles();
                    renderPhysicalAssets();
                    renderLoanStatus();
                    updateLenderSuggestions();

                    if (document.getElementById('analysis')?.classList.contains('active')) runProAnalysis();
                    if (document.getElementById('stats')?.classList.contains('active')) runReport();
                } catch (err) {
                    console.error('Critical Load Error:', err);
                    msg('Sync failed. Check your connection and try again.');
                }
            }

            function calculate() {
                const cryptoQuantity = toNumber(conf.Crypto_Balance);
                const exchangeRate = toNumber(conf.Rate);
                bal = {
                    Main: roundMoney(conf.Main_Balance),
                    Saving: roundMoney(conf.Saving_Balance),
                    CC: roundMoney(conf.CCS),
                    Crypto: roundMoney(cryptoQuantity * exchangeRate)
                };

                const today = todayDateKey();
                const thisMonth = today.slice(0, 7);
                let mainOpeningThisMonth = bal.Main;
                let mainMonthIncome = 0;
                let mainMonthExpense = 0;

                txs.forEach(transaction => {
                    const date = validDateKey(transaction.Date);
                    const amount = transactionAmount(transaction);
                    const accountKey = ACCOUNT_KEYS[transaction.Account];
                    if (!date || date > today || !accountKey || amount <= 0) return;

                    let delta = 0;
                    if (transaction.Type === 'Income') delta = amount;
                    else if (transaction.Type === 'Expense') delta = -amount;
                    else return;

                    bal[accountKey] = roundMoney(bal[accountKey] + delta);

                    if (transaction.Account === 'Main') {
                        if (date.slice(0, 7) < thisMonth) {
                            mainOpeningThisMonth = roundMoney(mainOpeningThisMonth + delta);
                        } else if (date.slice(0, 7) === thisMonth) {
                            if (delta > 0) {
                                if (!isMonthEndSalary(transaction)) {
                                    mainMonthIncome = roundMoney(mainMonthIncome + delta);
                                }
                            } else if (delta < 0) {
                                mainMonthExpense = roundMoney(mainMonthExpense - delta);
                            }
                        }
                    }
                });

                let totalLent = 0;
                let totalBorrowed = 0;
                loans.forEach(loan => {
                    const amount = Math.max(0, roundMoney(loan.Amount));
                    if (loan.Type === 'Lending') totalLent += amount;
                    else if (loan.Type === 'Borrowing') totalBorrowed += amount;
                });

                const creditLimit = Math.max(0, toNumber(conf.CCL));
                const creditCardDebt = Math.max(0, roundMoney(creditLimit - bal.CC));
                const accountBalances = [bal.Main, bal.Saving, bal.Crypto];
                const liquidAssets = roundMoney(accountBalances.reduce((sum, balance) => sum + Math.max(0, balance), 0));
                const accountOverdrafts = roundMoney(accountBalances.reduce((sum, balance) => sum + Math.max(0, -balance), 0));
                const physicalAssets = roundMoney(physAssets.reduce((sum, asset) => sum + getEstimatedAssetValue(asset), 0));
                const totalAssets = roundMoney(liquidAssets + totalLent + physicalAssets);
                const totalLiabilities = roundMoney(creditCardDebt + totalBorrowed + accountOverdrafts);
                const netWorth = roundMoney(totalAssets - totalLiabilities);

                const setVal = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) element.innerText = formatMoney(value);
                };
                setVal('vMain', bal.Main);
                setVal('vSave', bal.Saving);
                setVal('vCC', bal.CC);
                setVal('vCry', bal.Crypto);
                const netWorthEl = document.getElementById('netVal');
                if (netWorthEl) netWorthEl.innerText = `LKR ${formatMoney(netWorth)}`;

                const liquidityPct = totalAssets > 0 ? liquidAssets / totalAssets * 100 : NaN;
                const physicalAssetPct = totalAssets > 0 ? physicalAssets / totalAssets * 100 : 0;
                const mainFundsAvailable = roundMoney(mainOpeningThisMonth + mainMonthIncome);
                const mainRemaining = roundMoney(mainFundsAvailable - mainMonthExpense);
                const remainingPct = mainFundsAvailable > 0 ? mainRemaining / mainFundsAvailable * 100 : NaN;

                updateRing('overallRing', 'overallPct', liquidityPct);
                updateRing('assetRing', 'assetPct', physicalAssetPct);
                updateRing('monthRing', 'monthPct', remainingPct);
            }

            function updateRing(id, textId, pct) {
                const ring = document.getElementById(id);
                const text = document.getElementById(textId);

                const validPct = Number.isFinite(pct);
                const safePct = validPct ? Math.max(0, Math.min(100, pct)) : 0;

                if (ring) {
                    const circumference = 100; // Assumes pathLength="100" in SVG
                    const offset = circumference - (safePct / 100) * circumference;
                    ring.style.strokeDasharray = circumference;
                    ring.style.strokeDashoffset = offset;
                }

                if (text) text.innerText = validPct ? `${Math.round(pct)}%` : '—';
            }

            function renderSubPie(txList, chartId, legendId) {
                const expenses = txList.filter(t => t.Type === 'Expense' && !isNonOperatingFlow(t) && transactionAmount(t) > 0);
                const total = expenses.reduce((sum, t) => sum + transactionAmount(t), 0);
                const subCats = {};

                // Aggregate by Subcategory
                expenses.forEach(t => {
                    const subcategory = t.Subcategory || 'Uncategorized';
                    subCats[subcategory] = (subCats[subcategory] || 0) + transactionAmount(t);
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
            <span>${escapeHtml(item[0])}</span>
            <div class="legend-pct">${Math.round(pct)}%</div>
        </div>`;
                });

                const chartEl = document.getElementById(chartId);
                if (chartEl) chartEl.style.background = total > 0 ? `conic-gradient(${gradient.join(', ')})` : 'var(--border)';
                const legend = document.getElementById(legendId);
                if (legend) legend.innerHTML = total > 0 ? legendHtml : '<center style="grid-column: span 2;">No Data</center>';
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
                    const today = todayDateKey();
                    const curYear = today.slice(0, 4);
                    const curMonth = `-${today.slice(5, 7)}-`;

                    if (document.getElementById('fYear')) document.getElementById('fYear').value = curYear;
                    if (document.getElementById('fMonth')) document.getElementById('fMonth').value = curMonth;
                    if (document.getElementById('fType')) document.getElementById('fType').value = '';
                    if (document.getElementById('fAcc')) document.getElementById('fAcc').value = '';
                    if (document.getElementById('fKey')) document.getElementById('fKey').value = '';

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

            function toggleSpecialBoxes() {
                const type = document.getElementById('eType').value;
                const category = document.getElementById('eCat').value;
                const subcategory = document.getElementById('eSub').value;
                const vehicleBox = document.getElementById('vehBox');
                const lenderBox = document.getElementById('lenderBox');

                vehicleBox.style.display = category === 'Transportation' && subcategory !== 'Commuting (Bus/Train)'
                    ? 'block' : 'none';

                const needsPerson = category === 'Debt & Finance' && [
                    'Loan (Borrowing)', 'Loan Repayment', 'Lending', 'Debt Collection'
                ].includes(subcategory);
                lenderBox.style.display = needsPerson ? 'block' : 'none';
                if (needsPerson) updateLenderSuggestions(type, subcategory);
            }

            async function updateLenderSuggestions(currentTxType, subcategory) {
                const list = document.getElementById('lenderSuggestions');
                if (!list) return;

                let targetType = null;
                if (subcategory === 'Loan Repayment') targetType = 'Borrowing';
                if (subcategory === 'Debt Collection') targetType = 'Lending';

                let query = supa.from('Finance_Management')
                    .select('Person_Name')
                    .eq('Status', 'Active');
                if (targetType) query = query.eq('Type', targetType);

                const { data, error } = await query;
                if (error) {
                    console.error('Lender suggestion load failed:', error);
                    list.innerHTML = '';
                    return;
                }

                const names = [...new Set((data || [])
                    .map(item => String(item?.Person_Name || '').trim())
                    .filter(Boolean))].sort((a, b) => a.localeCompare(b));
                list.innerHTML = names.map(name => `<option value="${escapeHtml(name)}">`).join('');
            }

            async function saveTx() {
                const date = validDateKey(document.getElementById('eDate').value);
                const account = document.getElementById('eAcc').value;
                const type = document.getElementById('eType').value;
                const category = document.getElementById('eCat').value;
                const subcategory = document.getElementById('eSub').value;
                const rawAmount = document.getElementById('eAmt').value;
                const amount = roundMoney(rawAmount);
                let remark = document.getElementById('eRem').value.trim();
                const vehicle = document.getElementById('eVeh').value.trim();
                const person = document.getElementById('eLender').value.trim();

                if (!date || date > todayDateKey()) return msg('Enter a valid transaction date no later than today');
                if (!ACCOUNT_KEYS[account]) return msg('Select a valid account');
                if (!['Income', 'Expense'].includes(type) || !CATS[type]?.[category]?.includes(subcategory)) {
                    return msg('Select a valid transaction type and category');
                }
                if (rawAmount === '' || !Number.isFinite(Number(rawAmount)) || amount <= 0) {
                    return msg('Enter an amount greater than zero');
                }

                const adjustment = getLoanAdjustment({ Type: type, Category: category, Subcategory: subcategory, Amount: amount });
                if (adjustment && !person) return msg('Specify the person or lender');

                let existingLoan = null;
                if (adjustment) {
                    const { data, error } = await supa.from('Finance_Management')
                        .select('*')
                        .eq('Person_Name', person)
                        .eq('Type', adjustment.type)
                        .eq('Status', 'Active')
                        .maybeSingle();
                    if (error) {
                        console.error('Loan lookup failed:', error);
                        return msg('Could not verify the loan balance');
                    }
                    existingLoan = data;
                    if (adjustment.change < 0) {
                        if (!existingLoan) return msg('No active balance exists for this person');
                        if (amount > roundMoney(existingLoan.Amount)) return msg('Payment exceeds the outstanding balance');
                    }
                }

                const vehicleSubcategories = ['Fuel', 'Service & Repairs', 'Legal (Insurance/Rev)', 'Parking'];
                if (category === 'Transportation' && vehicleSubcategories.includes(subcategory) && vehicle) {
                    remark = remark ? `${vehicle} - ${remark}` : vehicle;
                }

                const transaction = {
                    Date: date,
                    Account: account,
                    Type: type,
                    Category: category,
                    Subcategory: subcategory,
                    Amount: amount,
                    Remark: remark
                };
                if (person) transaction.Person_Name = person;

                const { data: insertedTransactions, error: txError } = await supa
                    .from('Transaction_Records')
                    .insert([transaction])
                    .select('id')
                    .single();
                if (txError) {
                    console.error('Transaction insert failed:', txError);
                    return msg('Transaction could not be saved');
                }

                if (adjustment) {
                    const currentAmount = roundMoney(existingLoan?.Amount);
                    const newAmount = roundMoney(currentAmount + adjustment.change);
                    let ledgerResult;
                    if (existingLoan) {
                        ledgerResult = await supa.from('Finance_Management').update({
                            Amount: newAmount,
                            Status: newAmount === 0 ? 'Settled' : 'Active',
                            Last_Update: todayDateKey()
                        }).eq('id', existingLoan.id);
                    } else {
                        ledgerResult = await supa.from('Finance_Management').insert([{
                            Person_Name: person,
                            Amount: newAmount,
                            Type: adjustment.type,
                            Date: date,
                            Category: 'Personal',
                            Status: 'Active',
                            Last_Update: todayDateKey()
                        }]);
                    }

                    if (ledgerResult.error) {
                        console.error('Loan ledger update failed:', ledgerResult.error);
                        const { error: rollbackError } = await supa.from('Transaction_Records')
                            .delete().eq('id', insertedTransactions.id);
                        if (rollbackError) {
                            console.error('Could not roll back transaction:', rollbackError);
                            return msg('Transaction saved, but loan balance sync failed. Please review it.');
                        }
                        return msg('Loan balance could not be updated; transaction was rolled back');
                    }
                }

                const savedTransaction = { ...transaction, id: insertedTransactions.id };
                locallyInsertedTransactions.set(String(savedTransaction.id), savedTransaction);
                locallyInsertedOrder.set(String(savedTransaction.id), ++localInsertSequence);
                txs = sortTransactions([savedTransaction, ...txs.filter(item => String(item.id) !== String(savedTransaction.id))]);
                calculate();
                renderDashboard();
                if (document.getElementById('analysis')?.classList.contains('active')) runProAnalysis();
                if (document.getElementById('stats')?.classList.contains('active')) runReport();

                msg('Entry saved successfully');
                clearForms();
                await load();
            }

            async function saveConf() {
                const readInput = id => {
                    const raw = document.getElementById(id).value.trim();
                    if (raw === '') return 0;
                    const value = Number(raw);
                    return Number.isFinite(value) ? roundMoney(value) : NaN;
                };
                const main = readInput('cMain');
                const saving = readInput('cSave');
                const creditLimit = readInput('sCCL');
                const creditAvailable = readInput('sCCS');
                const rate = readInput('cRate');
                const crypto = readInput('cCry');
                const values = [main, saving, creditLimit, creditAvailable, rate, crypto];

                if (values.some(value => !Number.isFinite(value))) return msg('Enter valid numbers for all balances');
                if (creditLimit < 0 || rate < 0 || crypto < 0) return msg('Credit limit, rate, and crypto quantity cannot be negative');
                if (crypto > 0 && rate <= 0) return msg('Enter a positive USDT rate for the crypto balance');

                const payload = {
                    Main_Balance: main,
                    Saving_Balance: saving,
                    CCL: creditLimit,
                    // The form asks for available credit, so store it directly.
                    CCS: creditAvailable,
                    Rate: rate,
                    Crypto_Balance: crypto
                };

                const { error } = await supa.from('Config').upsert({ id: 1, ...payload });
                if (error) {
                    console.error('Sync Error:', error);
                    return msg('Baseline sync failed');
                }

                conf = { ...conf, ...payload };
                syncConfigForm();
                msg('Opening balances synced');
                await load();
            }

            async function delTx(id) {
                const { data: transaction, error: fetchError } = await supa.from('Transaction_Records')
                    .select('*').eq('id', id).maybeSingle();
                if (fetchError || !transaction) return msg('Could not load the transaction to delete');

                if (isTransfer(transaction)) {
                    const { data: candidates, error } = await fetchAllRows('Transaction_Records', query => query
                        .eq('Date', transaction.Date)
                        .eq('Amount', transaction.Amount));
                    if (error) return msg('Could not find the other side of this transfer');

                    const targetAccount = String(transaction.Remark || '').replace(/^(To|From)\s+/, '');
                    const isOutgoing = String(transaction.Subcategory || '').toLowerCase() === 'transfer out';
                    const expectedSubcategory = isOutgoing ? 'transfer in' : 'transfer out';
                    const expectedRemark = isOutgoing
                        ? `From ${transaction.Account}`
                        : `To ${transaction.Account}`;
                    const counterpart = (candidates || []).find(candidate =>
                        candidate.id !== transaction.id &&
                        isTransfer(candidate) &&
                        candidate.Account === targetAccount &&
                        String(candidate.Subcategory || '').toLowerCase() === expectedSubcategory &&
                        candidate.Remark === expectedRemark
                    );
                    if (!counterpart) return msg('Transfer pair is missing; reconcile it before deleting');
                    if (!confirm('Delete both sides of this transfer?')) return;

                    const { error: deleteError } = await supa.from('Transaction_Records')
                        .delete().in('id', [transaction.id, counterpart.id]);
                    if (deleteError) return msg('Transfer could not be deleted');
                    msg('Transfer deleted');
                    return load();
                }

                const adjustment = getLoanAdjustment(transaction);
                let loanRow = null;
                let restoredAmount = null;
                if (adjustment) {
                    const person = String(transaction.Person_Name || '').trim();
                    if (!person) return msg('This older loan transaction has no linked person and cannot be safely reversed');

                    const { data: candidates, error } = await fetchAllRows('Finance_Management', query => query
                        .eq('Person_Name', person)
                        .eq('Type', adjustment.type)
                        .in('Status', ['Active', 'Settled'])
                        .order('Date', { ascending: false })
                        .order('id', { ascending: true }));
                    if (error) return msg('Could not find the linked loan balance');

                    const transactionDate = validDateKey(transaction.Date);
                    const matchingLoans = (candidates || []).filter(candidate => {
                        const openedDate = validDateKey(candidate.Date);
                        return openedDate && transactionDate && openedDate <= transactionDate;
                    });
                    if (!matchingLoans.length) return msg('Could not find the linked loan balance for this date');
                    if (matchingLoans.length > 1 && validDateKey(matchingLoans[0].Date) === validDateKey(matchingLoans[1].Date)) {
                        return msg('Multiple loans match this transaction; reconcile the loan records first');
                    }

                    // Use the latest loan opening on or before this transaction. This keeps a
                    // deletion tied to the correct loan when the same person borrowed again later.
                    loanRow = matchingLoans[0];
                    restoredAmount = roundMoney(toNumber(loanRow.Amount) - adjustment.change);
                    if (restoredAmount < 0) {
                        return msg('Later loan activity depends on this transaction; delete those entries first');
                    }
                }

                if (!confirm('Delete this transaction permanently?')) return;

                if (loanRow) {
                    const { error } = await supa.from('Finance_Management').update({
                        Amount: restoredAmount,
                        Status: restoredAmount === 0 ? 'Settled' : 'Active',
                        Last_Update: todayDateKey()
                    }).eq('id', loanRow.id);
                    if (error) return msg('Could not reverse the linked loan balance');
                }

                const { error: deleteError } = await supa.from('Transaction_Records')
                    .delete().eq('id', transaction.id);
                if (deleteError) {
                    if (loanRow) {
                        const { error: rollbackError } = await supa.from('Finance_Management').update({
                            Amount: loanRow.Amount,
                            Status: loanRow.Status,
                            Last_Update: loanRow.Last_Update
                        }).eq('id', loanRow.id);
                        if (rollbackError) {
                            console.error('Loan balance rollback failed:', rollbackError);
                            return msg('Transaction delete failed and its loan balance could not be restored; please review the loan record');
                        }
                    }
                    return msg('Transaction could not be deleted');
                }

                msg('Record deleted');
                await load();
            }

            async function doTransfer() {
                const from = document.getElementById('tFrom').value;
                const to = document.getElementById('tTo').value;
                const rawAmount = document.getElementById('tAmt').value;
                const amount = roundMoney(rawAmount);
                const date = validDateKey(document.getElementById('tDate').value);

                if (!date || date > todayDateKey() || !ACCOUNT_KEYS[from] || !ACCOUNT_KEYS[to] || from === to ||
                    rawAmount === '' || !Number.isFinite(Number(rawAmount)) || amount <= 0) {
                    return msg('Enter a valid date, amount, and two different accounts');
                }

                const { error } = await supa.from('Transaction_Records').insert([
                    { Date: date, Account: from, Type: 'Expense', Category: 'Transfer', Subcategory: 'Transfer Out', Amount: amount, Remark: `To ${to}` },
                    { Date: date, Account: to, Type: 'Income', Category: 'Transfer', Subcategory: 'Transfer In', Amount: amount, Remark: `From ${from}` }
                ]);
                if (error) {
                    console.error('Transfer insert failed:', error);
                    return msg('Transfer failed; no account balances were changed');
                }

                msg('Transfer completed');
                clearForms();
                await load();
            }

            // --- ASSETS & VEHICLES CRUD ---

            async function addPhysicalAsset() {
                const name = document.getElementById('aName').value.trim();
                const rawValue = document.getElementById('aVal').value;
                const value = roundMoney(rawValue);
                const category = document.getElementById('aCat').value;
                const specs = document.getElementById('aSpec').value.trim();
                const purchaseDate = validDateKey(document.getElementById('aDate').value);

                if (!name || rawValue === '' || !Number.isFinite(Number(rawValue)) || value <= 0) {
                    return msg('Enter an asset name and a value greater than zero');
                }
                if (!purchaseDate || purchaseDate > todayDateKey()) return msg('Enter a valid purchase date no later than today');

                const { error } = await supa.from('Physical_Assets').insert([{
                    Name: name,
                    Value: value,
                    Category: category,
                    Specs: specs,
                    Purchase_Date: purchaseDate
                }]);
                if (error) {
                    console.error('Asset insert failed:', error);
                    return msg('Asset could not be saved');
                }

                msg('Asset added');
                clearForms();
                await load();
            }

            async function delPhysAsset(id) {
                if (confirm("Delete Asset?")) {
                    const { error } = await supa.from('Physical_Assets').delete().eq('id', id);
                    if (error) return msg('Asset could not be deleted');
                    await load();
                }
            }

            function getEstimatedAssetValue(asset) {
                // The form captures an estimated current market value, not acquisition cost.
                // Apply no assumed depreciation schedule to a user's current valuation.
                return Math.max(0, roundMoney(asset?.Value));
            }

            async function addVehicle() {
                const reg = document.getElementById('vReg').value.trim();
                const make = document.getElementById('vMake').value.trim();
                if (!reg) return msg('Registration required');
                const { error } = await supa.from('Vehicles').insert([{ Registration: reg, Model: make }]);
                if (error) {
                    console.error('Vehicle insert failed:', error);
                    return msg('Vehicle could not be saved');
                }
                msg('Vehicle added');
                document.getElementById('vReg').value = '';
                document.getElementById('vMake').value = '';
                await load();
            }

            async function delVehicle(id) {
                if (confirm("Delete Vehicle?")) {
                    const { error } = await supa.from('Vehicles').delete().eq('id', id);
                    if (error) return msg('Vehicle could not be deleted');
                    await load();
                }
            }



            // --- ANALYSIS ENGINE (Pro) ---

            function runProAnalysis() {
                const year = document.getElementById('aYear').value;
                const month = document.getElementById('aMonth').value;
                const pData = transactionsForPeriod(txs, year, month);
                const spendingPeriodData = transactionsForSpendingPeriod(txs, year, month);
                const today = todayDateKey();
                const currentMonth = currentMonthKey();
                const currentMonthData = txs.filter(t => {
                    const date = validDateKey(t.Date);
                    return date && date.slice(0, 7) === currentMonth && date <= today;
                });
                const { income, expense } = getIncomeExpense(spendingPeriodData);
                const saveRate = income > 0 ? ((income - expense) / income) * 100 : null;
                const elapsedDays = elapsedDaysInPeriod(year, month);
                const saveRateEl = document.getElementById('anSaveRate');
                saveRateEl.innerText = saveRate === null ? '—' : `${formatMoney(saveRate)}%`;
                saveRateEl.style.color = saveRate !== null && saveRate >= 20 ? 'var(--income)' : 'var(--expense)';
                document.getElementById('anBurn').innerText = elapsedDays ? formatMoney(expense / elapsedDays) : '—';

                const score = saveRate === null ? null : Math.round(Math.max(0, Math.min(100, saveRate)));
                const statusEl = document.getElementById('proStatus');
                document.getElementById('proScore').innerText = score === null ? '—' : `${score}%`;
                statusEl.innerText = score === null ? 'NO INCOME RECORDED' :
                    score >= 50 ? 'STRONG SAVINGS' : score >= 20 ? 'POSITIVE SAVINGS' :
                        saveRate >= 0 ? 'LOW SAVINGS' : 'SPENDING EXCEEDS INCOME';
                statusEl.style.color = score === null ? 'var(--sub)' :
                    score >= 20 ? 'var(--income)' : score > 0 ? '#fbbf24' : 'var(--expense)';

                const categoryTotals = {};
                pData.filter(t => t.Type === 'Expense' && !isNonOperatingFlow(t)).forEach(t => {
                    const category = String(t.Category || 'Uncategorized');
                    categoryTotals[category] = (categoryTotals[category] || 0) + transactionAmount(t);
                });
                const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
                const chart = document.getElementById('anChart');
                chart.innerHTML = categories.slice(0, 5).map(([category, amount]) => {
                    const percent = expense > 0 ? Math.min(100, (amount / expense) * 100) : 0;
                    return `
            <div style="margin-bottom:8px">
                <div style="display:flex; justify-content:space-between; font-size:11px;"><span>${escapeHtml(category)}</span><span>${formatMoney(percent)}%</span></div>
                <div style="width:100%; height:6px; background:var(--border); border-radius:4px;"><div style="width:${percent}%; height:100%; background:var(--primary); border-radius:4px;"></div></div>
            </div>`;
                }).join('') || '<small style="color:var(--sub)">No operating expenses in this period.</small>';

                const topCategory = categories[0]?.[0];
                const performanceNote = saveRate === null
                    ? 'Record spend-cycle income to calculate a savings rate.'
                    : saveRate < 0 ? 'Recorded operating expenses exceed spend-cycle income.'
                        : saveRate < 20 ? 'Less than 20% of spend-cycle income remains after expenses.'
                            : 'At least 20% of spend-cycle income remains after expenses.';
                document.getElementById('anInsights').innerHTML = `
        Spend-cycle income <b>LKR ${formatMoney(income)}</b> · operating expenses <b>LKR ${formatMoney(expense)}</b>.
        ${topCategory ? `Largest expense category: <b>${escapeHtml(topCategory)}</b>.` : 'No operating expense category recorded.'}
        ${escapeHtml(performanceNote)} Savings rate is (spend-cycle income − expenses) ÷ spend-cycle income. Salary received on the final day of a month is counted in the following month's spend cycle. Transfers and loan principal are excluded; record loan interest separately as an expense.
    `;

                const dateParts = today.split('-').map(Number);
                const daysRemaining = daysInMonth(dateParts[0], dateParts[1]) - dateParts[2] + 1;
                const formatDaily = value => `LKR ${formatMoney(value)}`;
                const monthEndSalaryByAccount = txs.reduce((totals, transaction) => {
                    if (validDateKey(transaction.Date) !== today || !isMonthEndSalary(transaction)) return totals;
                    if (transaction.Account === 'Main' || transaction.Account === 'Saving') {
                        totals[transaction.Account] = roundMoney(totals[transaction.Account] + transactionAmount(transaction));
                    }
                    return totals;
                }, { Main: 0, Saving: 0 });
                const dailyMainBalance = toNumber(bal.Main) - monthEndSalaryByAccount.Main;
                const dailySavingBalance = toNumber(bal.Saving) - monthEndSalaryByAccount.Saving;
                const dailyTotal = (dailyMainBalance + dailySavingBalance) / daysRemaining;
                const dailyTotalEl = document.getElementById('anDailyTotal');
                dailyTotalEl.innerText = formatDaily(dailyTotal);
                dailyTotalEl.style.color = dailyTotal >= 0 ? 'var(--income)' : 'var(--expense)';
                document.getElementById('anDailyMain').innerText = formatDaily(dailyMainBalance / daysRemaining);
                document.getElementById('anDailySave').innerText = formatDaily(dailySavingBalance / daysRemaining);
                document.getElementById('daysLeftNote').innerText = `Guide: Main + Saving balances available for this spend cycle ÷ ${daysRemaining} remaining calendar day${daysRemaining === 1 ? '' : 's'}, including today. Month-end salary is reserved for next month; upcoming bills are not deducted.`;

                renderSubPie(txs.filter(t => {
                    const date = validDateKey(t.Date);
                    return date && date <= today;
                }), 'pieAll', 'legendAll');
                renderSubPie(pData, 'pieSelected', 'legendSelected');
                renderSubPie(currentMonthData, 'pieMonth', 'legendMonth');
            }

            // --- REPORTS ---

            function updateDateFilters() {
                const thisYear = todayDateKey().slice(0, 4);
                const today = todayDateKey();
                const years = [...new Set([
                    thisYear,
                    ...txs.map(t => validDateKey(t.Date)).filter(date => date && date <= today).map(date => date.slice(0, 4))
                ])].sort((a, b) => Number(b) - Number(a));
                const yearOptions = years.map(year => `<option value="${year}">${year}</option>`).join('');
                document.getElementById('fYear').innerHTML = `<option value="">All Years</option>${yearOptions}`;
                document.getElementById('aYear').innerHTML = yearOptions;
                const monthOptions = MONTH_NAMES.map((name, index) => {
                    const month = String(index + 1).padStart(2, '0');
                    return `<option value="-${month}-">${name}</option>`;
                }).join('');
                document.getElementById('fMonth').innerHTML = `<option value="">All Months</option>${monthOptions}`;
                document.getElementById('aMonth').innerHTML = `<option value="all">Full Year View</option>${monthOptions}`;

                const thisMonth = `-${todayDateKey().slice(5, 7)}-`;
                document.getElementById('fYear').value = thisYear;
                document.getElementById('fMonth').value = thisMonth;
                document.getElementById('aYear').value = thisYear;
                document.getElementById('aMonth').value = thisMonth;
            }

            async function runReport() {
                const y = document.getElementById('fYear').value;
                const m = document.getElementById('fMonth').value;
                const t = document.getElementById('fType').value;
                const a = document.getElementById('fAcc').value;
                const k = document.getElementById('fKey').value.trim().toLocaleLowerCase();
                const matchesDate = transaction => {
                    const date = validDateKey(transaction.Date);
                    return date && date <= todayDateKey() && (!y || date.startsWith(y)) &&
                        (!m || date.slice(5, 7) === m.slice(1, 3));
                };
                const matchesAccount = transaction => !a || transaction.Account === a;
                const filtered = txs.filter(x => {
                    const matchDate = matchesDate(x);
                    const matchType = !t || x.Type === t;
                    const searchable = [x.Remark, x.Subcategory, x.Category, x.Person_Name].join(' ').toLocaleLowerCase();
                    return matchDate && matchType && matchesAccount(x) && (!k || searchable.includes(k));
                });
                reportData = filtered.sort((left, right) => String(right.Date).localeCompare(String(left.Date)));
                const { income: inc, expense: exp } = getIncomeExpense(reportData);
                const globalNet = inc - exp;
                const forecastEl = document.getElementById('monthlyForecastValue');
                if (forecastEl) {
                    forecastEl.classList.remove('pill-neutral', 'pill-positive', 'pill-negative');
                    const today = todayDateKey();
                    const monthKey = m ? m.slice(1, 3) : '';
                    const forecastRecords = transactionsForSpendingPeriod(
                        txs, today.slice(0, 4), today.slice(5, 7)
                    ).filter(transaction => matchesAccount(transaction));
                    const isCurrentMonthSelected = (!y || y === today.slice(0, 4)) && monthKey === today.slice(5, 7);
                    if (isCurrentMonthSelected) {
                        const { income, expense } = getIncomeExpense(forecastRecords);
                        const priorMonthSalary = roundMoney(forecastRecords
                            .filter(isMonthEndSalary)
                            .reduce((sum, transaction) => sum + transactionAmount(transaction), 0));
                        const currentMonthIncome = roundMoney(income - priorMonthSalary);
                        const elapsed = Number(today.slice(8, 10));
                        const projectedNet = priorMonthSalary +
                            ((currentMonthIncome - expense) / elapsed) * daysInMonth(
                                Number(today.slice(0, 4)), Number(today.slice(5, 7))
                            );
                        const isPos = projectedNet >= 0;
                        forecastEl.classList.add(isPos ? 'pill-positive' : 'pill-negative');
                        forecastEl.innerText = `LKR ${formatMoney(Math.abs(projectedNet))}`;
                    } else {
                        forecastEl.classList.add('pill-neutral');
                        forecastEl.innerText = 'N/A for selected period';
                    }
                }
                const getAccountMovement = account => {
                    return reportData.filter(transaction => transaction.Account === account)
                        .reduce((sum, transaction) => {
                            const direction = transaction.Type === 'Income' ? 1 : transaction.Type === 'Expense' ? -1 : 0;
                            return sum + direction * transactionAmount(transaction);
                        }, 0);
                };
                const accountMovements = Object.keys(ACCOUNT_KEYS).map(account => [account, getAccountMovement(account)]);
                const summaryBox = document.getElementById('reportSummary');
                if (summaryBox) {
                    summaryBox.style.display = 'block';
                    summaryBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                <span style="font-size:12px;">Income: <b style="color:var(--income)">${formatMoney(inc)}</b> | Expenses: <b style="color:var(--expense)">${formatMoney(exp)}</b></span>
                <b id="repNet" style="color:${globalNet >= 0 ? 'var(--income)' : 'var(--expense)'}">Net: LKR ${formatMoney(Math.abs(globalNet))}</b>
            </div>
            <small class="label-sm">Account movement for matching records; includes transfers.</small>
            <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; text-align:center; margin-top:8px;">
                ${accountMovements.map(([account, movement]) => `<div><small class="label-sm">${escapeHtml(account)}</small><br><b style="color:${movement >= 0 ? 'var(--income)' : 'var(--expense)'}">LKR ${formatMoney(Math.abs(movement))}</b></div>`).join('')}
            </div>
        `;
                }
                const listBody = document.getElementById('reportList');
                if (listBody) {
                    listBody.innerHTML = reportData.length ? reportData.map(x => `
            <div class="list-item" style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border); font-size:12px;">
                <div>
                    <b style="color:var(--text)">${escapeHtml(x.Subcategory || x.Category || 'Transaction')}</b><br>
                    <small style="color:var(--sub)">${escapeHtml(validDateKey(x.Date) || 'Invalid date')} • ${escapeHtml(x.Account || 'Unknown account')}</small>
                </div>
                <div style="text-align:right">
                    <div style="font-weight:800; color:${x.Type === 'Income' ? 'var(--income)' : 'var(--expense)'}">
                        LKR ${formatMoney(transactionAmount(x))}
                    </div>
                    <small style="color:var(--sub)">${escapeHtml(x.Remark || '')}</small>
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
                const csvCell = value => {
                    const text = String(value ?? '');
                    const spreadsheetSafeText = /^[\t\r ]*[=+@-]/.test(text) ? `'${text}` : text;
                    return `"${spreadsheetSafeText.replace(/"/g, '""')}"`;
                };
                const rows = reportData.map(tx => [
                    tx.Date,
                    tx.Account,
                    tx.Type,
                    tx.Category,
                    tx.Subcategory,
                    roundMoney(transactionAmount(tx)).toFixed(2),
                    tx.Remark,
                    tx.Person_Name
                ].map(csvCell).join(","));

                const csvContent = [headers.map(csvCell).join(","), ...rows].join("\r\n");
                const objectUrl = URL.createObjectURL(new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8' }));
                const link = document.createElement("a");
                link.setAttribute("href", objectUrl);
                link.setAttribute("download", `Finance_Export_${todayDateKey()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

                msg("CSV Downloaded");
            }

            function renderDashboard() {
                const list = document.getElementById('recentList');
                if (!list) return;

                // This section is today's activity only; do not mix in earlier dates.
                const today = todayDateKey();
                const recent = sortTransactions(txs.filter(transaction =>
                    validDateKey(transaction.Date) === today
                ));

                if (recent.length === 0) {
                    list.innerHTML = "<center><small style='color:var(--sub)'>No transactions recorded today</small></center>";
                    return;
                }

                list.innerHTML = recent.map(x => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border);">
            <div style="flex:1;">
                <b style="font-size:13px;">${escapeHtml(x.Subcategory || x.Category || 'Transaction')}</b><br>
                <small style="color:var(--sub); font-size:10px;">${escapeHtml(validDateKey(x.Date))} • ${escapeHtml(x.Account || '')}</small>
            </div>
            <div style="text-align:right; margin-right:10px;">
                <div style="font-weight:800; font-size:14px; color:${x.Type === 'Income' ? 'var(--income)' : 'var(--expense)'}">
                    LKR ${formatMoney(transactionAmount(x))}
                </div>
                <small style="color:var(--sub); font-size:9px; text-transform:uppercase;">${escapeHtml(x.Category || '')}</small>
            </div>
            <button onclick="delTx('${escapeHtml(x.id)}')" class="btn-del" style="height:28px; width:28px; background:none; border:none; color:var(--expense); cursor:pointer; font-size:18px;">×</button>
        </div>
    `).join('');
            }

            function renderLoanStatus() {

                const container = document.getElementById('loanStatusList');
                // Only display 'Active' status records to keep dashboard clean
                const activeLoans = loans.filter(l => l.Status === 'Active' && roundMoney(l.Amount) > 0);

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
                    return `
            <div style="padding: 12px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <b style="font-size: 14px;">${escapeHtml(l.Person_Name || 'Unknown person')}</b><br>
                    <small style="color: ${color}; font-weight:700; font-size: 10px; border: 1px solid ${color}; padding: 2px 6px; border-radius: 6px; margin-top: 4px; display:inline-block;">
                        ${label}
                    </small>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 800; font-size: 15px; color: ${color};">
                        LKR ${formatMoney(l.Amount)}
                    </div>
                    <small style="font-size: 10px; color: var(--sub);">
                        ${l.Due_Date ? 'Due: ' + escapeHtml(validDateKey(l.Due_Date) || l.Due_Date) : 'Active'}
                    </small>
                </div>
            </div>
        `;
                }).join('');
            }

            function renderPhysicalAssets() {
                const list = document.getElementById('assetList');
                if (!list) return;

                const totalValue = physAssets.reduce((sum, asset) => sum + getEstimatedAssetValue(asset), 0);
                const totalValueEl = document.getElementById('totalAssetVal');
                if (totalValueEl) totalValueEl.innerText = `LKR ${formatMoney(totalValue)}`;

                list.innerHTML = physAssets.map(asset => {
                    const currentValue = getEstimatedAssetValue(asset);
                    const purchaseDate = validDateKey(asset.Purchase_Date);
                    return `
            <div class="card" style="margin-bottom:12px; padding:15px; border:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <label class="label-sm">${escapeHtml(asset.Category || 'Other')}</label>
                        <b style="font-size:14px;">${escapeHtml(asset.Name || 'Unnamed asset')}</b><br>
                        <small style="color:var(--sub)">${escapeHtml(asset.Specs || 'No Specs')}</small>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:800; color:var(--primary);">LKR ${formatMoney(currentValue)}</div>
                        <small style="color:var(--sub);">Current estimate</small>
                    </div>
                </div>
                ${purchaseDate ? `<small style="display:block; margin-top:8px; color:var(--sub);">Purchased ${purchaseDate}</small>` : ''}
                <button onclick="delPhysAsset('${escapeHtml(asset.id)}')" class="btn-del" style="margin-top:10px; width:100%; height:32px; border-radius:12px;">Remove Asset</button>
            </div>
        `;
                }).join('');
            }

            function renderVehicles() {
                const vSelect = document.getElementById('eVeh');
                if (vSelect) {
                    vSelect.innerHTML = `<option value="">No vehicle selected</option>${vehs.map(vehicle => {
                        const registration = String(vehicle.Registration || '');
                        const model = String(vehicle.Model || '');
                        return `<option value="${escapeHtml(registration)}">${escapeHtml(registration)}${model ? ` (${escapeHtml(model)})` : ''}</option>`;
                    }).join('')}`;
                }
                const vehicleList = document.getElementById('vehicleList');
                if (vehicleList) {
                    vehicleList.innerHTML = vehs.length ? vehs.map(vehicle => `
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
                            <span><b>${escapeHtml(vehicle.Registration || 'Unregistered')}</b>${vehicle.Model ? ` · ${escapeHtml(vehicle.Model)}` : ''}</span>
                            <button onclick="delVehicle('${escapeHtml(vehicle.id)}')" class="btn-del" aria-label="Remove vehicle">×</button>
                        </div>`).join('') : '<small style="color:var(--sub)">No vehicles registered.</small>';
                }
            }

            // --- UTILS ---

            function clearForms() {
                const ids = ['eAmt', 'eRem', 'tAmt', 'aName', 'aVal', 'aSpec', 'eLender', 'vReg', 'vMake'];
                ids.forEach(id => { if (document.getElementById(id)) document.getElementById(id).value = ''; });
                document.getElementById('lenderBox').style.display = 'none';
                const today = todayDateKey();
                ['eDate', 'tDate'].forEach(id => { if (document.getElementById(id)) document.getElementById(id).value = today; });
                loadCats();
            }

            function updateLive(accId, pillId) {
                const selection = document.getElementById(accId).value;
                const accMap = { "Main": "Main", "Saving": "Saving", "Credit Card": "CC", "Crypto": "Crypto" };

                const targetKey = accMap[selection] || selection;
                const amount = bal[targetKey] || 0;

                const pill = document.getElementById(pillId);
                pill.innerText = "LKR " + formatMoney(amount);

                // Specific logic for Credit Card utilization warning
                if (selection === "Credit Card") {
                    const limit = Math.max(0, toNumber(conf.CCL));
                    const usage = limit > 0 ? (limit - amount) / limit : NaN;
                    pill.style.color = Number.isFinite(usage)
                        ? usage > 0.8 ? 'var(--expense)' : 'var(--income)'
                        : 'var(--sub)';
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
