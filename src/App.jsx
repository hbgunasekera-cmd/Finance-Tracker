import { useEffect } from 'react';
import './styles.css';

/**
 * React renders the existing finance screens. The finance engine remains a
 * classic script because it contains the established calculations, Supabase
 * data flow, and imperative renderers used by the app's reports and lists.
 */
export default function App() {
  useEffect(() => {
    // The finance engine uses classic-script globals for its existing controls.
    // Load it once after React has committed the screen markup.
    if (document.querySelector('script[data-finance-legacy]')) return;

    const script = document.createElement('script');
    script.src = '/legacy-app.js';
    script.dataset.financeLegacy = 'true';
    document.body.appendChild(script);
  }, []);

  return (
    <div className="finance-app-root">
<div id={"loginOverlay"} style={{position: "fixed", top: "0", left: "0", width: "100%", height: "100%", background: "var(--bg)", zIndex: "10000", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"}}>
  <div className={"card"} style={{width: "100%", maxWidth: "350px", border: "1px solid var(--border)", boxShadow: "0 10px 25px rgba(0,0,0,0.5)"}}>
    <center>
      <div style={{fontSize: "40px", marginBottom: "10px"}}>
        🔐
      </div>
      <h2 style={{marginBottom: "5px"}}>
        Finance Vault
      </h2>
      <p style={{color: "var(--sub)", fontSize: "12px", marginBottom: "25px"}}>
        Enter credentials to unlock
      </p>
    </center>
    <label className={"label-sm"}>
      Username
    </label>
    <input type={"text"} id={"loginUser"} placeholder={"Enter username"} style={{marginBottom: "15px", caretColor: "var(--text)"}} />
    <label className={"label-sm"}>
      Password
    </label>
    <input type={"password"} id={"loginPass"} placeholder={"Enter password"} style={{marginBottom: "20px", caretColor: "var(--text)"}} />
    <button id={"loginBtn"} className={"btn-p"} data-react-click={true} onClick={(event) => { window.validateLogin(); }} style={{width: "100%", marginTop: "10px"}}>
      
                Unlock Access
            
    </button>
    <div id={"loginError"} style={{color: "var(--expense)", marginTop: "15px", fontSize: "12px", textAlign: "center", display: "none", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "8px"}}>
    </div>
  </div>
</div>
<div id={"toast"}>
</div>
<div className={"app-container"}>
  <div style={{padding: "25px 20px 10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
    <div>
      <small style={{color: "var(--sub)", fontWeight: "600"}}>
        Finance Tracker
      </small>
      <h2 id={"vTitle"}>
        Overview
      </h2>
    </div>
    <div data-react-click={true} onClick={(event) => { window.toggleTheme(); }} style={{cursor: "pointer", fontSize: "22px"}}>
      🌓
    </div>
  </div>
  <section id={"dash"} className={"page active"}>
    <div className={"hero"}>
      <div style={{marginBottom: "25px"}}>
        <small style={{opacity: "0.7", letterSpacing: "2px", fontWeight: "800", fontSize: "10px"}}>
          TOTAL NET
                        WORTH
        </small>
        <h1 id={"netVal"} style={{fontSize: "38px", margin: "5px 0", fontWeight: "900", letterSpacing: "-1.5px"}}>
          
                        LKR 0
        </h1>
      </div>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "5px"}}>
        <div className={"progress-box"}>
          <svg viewBox={"0 0 36 36"} className={"ring-svg"}>
            <circle className={"ring-bg"} cx={"18"} cy={"18"} r={"15.9155"}>
            </circle>
            <circle id={"overallRing"} className={"ring-active overall"} cx={"18"} cy={"18"} r={"15.9155"} strokeDasharray={"0, 100"}>
            </circle>
          </svg>
          <div className={"ring-label"}>
            <span id={"overallPct"} style={{fontSize: "14px"}}>
              0%
            </span>
            <small style={{fontSize: "7px"}}>
              Liquidity
            </small>
          </div>
        </div>
        <div className={"progress-box"}>
          <svg viewBox={"0 0 36 36"} className={"ring-svg"}>
            <circle className={"ring-bg"} cx={"18"} cy={"18"} r={"15.9155"}>
            </circle>
            <circle id={"assetRing"} className={"ring-active"} cx={"18"} cy={"18"} r={"15.9155"} strokeDasharray={"0, 100"} style={{stroke: "#a855f7"}}>
            </circle>
          </svg>
          <div className={"ring-label"}>
            <span id={"assetPct"} style={{fontSize: "14px"}}>
              0%
            </span>
            <small style={{fontSize: "7px"}}>
              Physical
            </small>
          </div>
        </div>
        <div className={"progress-box"}>
          <svg viewBox={"0 0 36 36"} className={"ring-svg"}>
            <circle className={"ring-bg"} cx={"18"} cy={"18"} r={"15.9155"}>
            </circle>
            <circle id={"monthRing"} className={"ring-active monthly"} cx={"18"} cy={"18"} r={"15.9155"} strokeDasharray={"0, 100"}>
            </circle>
          </svg>
          <div className={"ring-label"}>
            <span id={"monthPct"} style={{fontSize: "14px"}}>
              0%
            </span>
            <small style={{fontSize: "7px"}}>
              Main Left
            </small>
          </div>
        </div>
      </div>
    </div>
    <div className={"f-grid"}>
      <div className={"card"} style={{margin: "0", textAlign: "center"}}>
        <label className={"label-sm"}>
          Main
        </label>
        <div id={"vMain"} style={{fontWeight: "800"}}>
          0
        </div>
      </div>
      <div className={"card"} style={{margin: "0", textAlign: "center"}}>
        <label className={"label-sm"}>
          Saving
        </label>
        <div id={"vSave"} style={{fontWeight: "800"}}>
          0
        </div>
      </div>
      <div className={"card"} style={{margin: "0", textAlign: "center"}}>
        <label className={"label-sm"}>
          CC Available (LKR)
        </label>
        <div id={"vCC"} style={{fontWeight: "800", color: "var(--expense)"}}>
          0
        </div>
      </div>
      <div className={"card"} style={{margin: "0", textAlign: "center"}}>
        <label className={"label-sm"}>
          Crypto Value (LKR)
        </label>
        <div id={"vCry"} style={{fontWeight: "800", color: "var(--income)"}}>
          0
        </div>
      </div>
    </div>
    <div className={"card"} style={{marginTop: "16px"}}>
      <label className={"label-sm"}>
        Loan & Lending Status
      </label>
      <div id={"loanStatusList"}>
      </div>
    </div>
    <div className={"card"} style={{marginTop: "16px"}}>
      <label className={"label-sm"}>
        Recent Transactions
      </label>
      <div id={"recentList"}>
      </div>
    </div>
  </section>
  <section id={"entry"} className={"page"}>
    <div style={{display: "flex", background: "var(--accent)", borderRadius: "14px", padding: "4px", marginBottom: "15px"}}>
      <button id={"tabTx"} data-react-click={true} onClick={(event) => { window.switchEntryTab('tx'); }} style={{flex: "1", padding: "10px", border: "none", borderRadius: "10px", background: "var(--primary)", color: "white", fontWeight: "700", cursor: "pointer"}}>
        Record
      </button>
      <button id={"tabTf"} data-react-click={true} onClick={(event) => { window.switchEntryTab('tf'); }} style={{flex: "1", padding: "10px", border: "none", borderRadius: "10px", background: "transparent", color: "var(--sub)", fontWeight: "700", cursor: "pointer"}}>
        Transfer
      </button>
    </div>
    <div id={"formTx"} className={"card"}>
      <span id={"eLive"} className={"live-pill"}>
        LKR 0
      </span>
      <h3 style={{marginTop: "0"}}>
        Transaction
      </h3>
      <div className={"f-grid"}>
        <div className={"full"}>
          <label className={"label-sm"}>
            Date
          </label>
          <input type={"date"} id={"eDate"} />
        </div>
        <div className={"full"}>
          <label className={"label-sm"}>
            Account
          </label>
          <select id={"eAcc"} onChange={(event) => { window.updateLive('eAcc','eLive'); }}>
            <option>
              Main
            </option>
            <option>
              Saving
            </option>
            <option>
              Credit Card
            </option>
          </select>
        </div>
        <div className={"full"}>
          <label className={"label-sm"}>
            Type
          </label>
          <select id={"eType"} onChange={(event) => { window.loadCats(); }}>
            <option>
              Expense
            </option>
            <option>
              Income
            </option>
          </select>
        </div>
        <div>
          <label className={"label-sm"}>
            Category
          </label>
          <select id={"eCat"} onChange={(event) => { window.loadSubs(); window.toggleSpecialBoxes(); }}>
          </select>
        </div>
        <div>
          <label className={"label-sm"}>
            Subcategory
          </label>
          <select id={"eSub"} onChange={(event) => { window.toggleSpecialBoxes(); }}>
          </select>
        </div>
        <div className={"full"} id={"vehBox"} style={{display: "none"}}>
          <label className={"label-sm"}>
            Vehicle
          </label>
          <select id={"eVeh"}>
          </select>
        </div>
        <div className={"full"} id={"lenderBox"} style={{display: "none"}}>
          <label className={"label-sm"}>
            Lender / Borrower Name
          </label>
          <input type={"text"} id={"eLender"} list={"lenderSuggestions"} placeholder={"Select or type name..."} className={"input-field"} />
          <datalist id={"lenderSuggestions"}>
          </datalist>
        </div>
        <div className={"full"}>
          <label className={"label-sm"}>
            Amount
          </label>
          <input type={"number"} id={"eAmt"} className={"amt-input"} placeholder={"0.00"} />
        </div>
        <div className={"full"}>
          <label className={"label-sm"}>
            Remark
          </label>
          <input type={"text"} id={"eRem"} placeholder={"Optional notes..."} />
        </div>
      </div>
      <button className={"btn-p"} data-react-click={true} onClick={(event) => { window.saveTx(); }}>
        Confirm Entry
      </button>
    </div>
    <div id={"formTf"} className={"card"} style={{display: "none"}}>
      <span id={"tLive"} className={"live-pill"}>
        LKR 0
      </span>
      <h3 style={{marginTop: "0"}}>
        Internal Transfer
      </h3>
      <div className={"f-grid"}>
        <div className={"full"}>
          <label className={"label-sm"}>
            Date
          </label>
          <input type={"date"} id={"tDate"} />
        </div>
        <div>
          <label className={"label-sm"}>
            From
          </label>
          <select id={"tFrom"} onChange={(event) => { window.updateLive('tFrom','tLive'); }}>
            <option>
              Main
            </option>
            <option>
              Saving
            </option>
            <option>
              Credit Card
            </option>
            <option>
              Crypto
            </option>
          </select>
        </div>
        <div>
          <label className={"label-sm"}>
            To
          </label>
          <select id={"tTo"}>
            <option>
              Saving
            </option>
            <option>
              Main
            </option>
            <option>
              Credit Card
            </option>
            <option>
              Crypto
            </option>
          </select>
        </div>
        <div className={"full"}>
          <label className={"label-sm"}>
            Amount
          </label>
          <input type={"number"} id={"tAmt"} className={"amt-input"} placeholder={"0.00"} />
        </div>
      </div>
      <button className={"btn-p"} data-react-click={true} onClick={(event) => { window.doTransfer(); }}>
        Execute Transfer
      </button>
    </div>
  </section>
  <section id={"assets"} className={"page"}>
    <div className={"card"}>
      <h3 style={{marginTop: "0"}}>
        Register New Asset
      </h3>
      <div className={"f-grid"}>
        <div className={"full"}>
          <label className={"label-sm"}>
            Asset Name
          </label>
          <input type={"text"} id={"aName"} placeholder={"e.g. iPhone 12 Pro"} />
        </div>
        <div className={"full"}>
          <label className={"label-sm"}>
            Purchase Date
          </label>
          <input type={"date"} id={"aDate"} />
        </div>
        <div>
          <label className={"label-sm"}>
            Category
          </label>
          <select id={"aCat"}>
            <option>
              Electronics
            </option>
            <option>
              Automobile
            </option>
            <option>
              Land
            </option>
            <option>
              Apartment
            </option>
            <option>
              Jewelry
            </option>
            <option>
              Furniture
            </option>
            <option>
              Tools
            </option>
            <option>
              Other
            </option>
          </select>
        </div>
        <div>
          <label className={"label-sm"}>
            Current Estimated Value (LKR)
          </label>
          <input type={"number"} id={"aVal"} className={"amt-input"} placeholder={"0.00"} />
        </div>
        <div className={"full"}>
          <label className={"label-sm"}>
            Specs / Serial No.
          </label>
          <input type={"text"} id={"aSpec"} placeholder={"256GB, Graphite, etc."} />
        </div>
      </div>
      <div style={{display: "flex", gap: "10px", marginTop: "15px"}}>
        <button className={"btn-p"} style={{flex: "2", marginTop: "0"}} data-react-click={true} onClick={(event) => { window.addPhysicalAsset(); }}>
          <span>
            ➕
          </span>
          
                        Register
        </button>
        <button className={"btn-s"} style={{flex: "1"}} data-react-click={true} onClick={(event) => { window.clearForms(); }}>
          Clear
        </button>
      </div>
    </div>
    <div className={"card"} style={{background: "var(--accent)", border: "1px dashed var(--primary)", textAlign: "center"}}>
      <label className={"label-sm"}>
        Total Estimated Asset Value
      </label>
      <h2 id={"totalAssetVal"} style={{margin: "5px 0", color: "var(--primary)"}}>
        LKR 0
      </h2>
    </div>
    <div id={"assetList"} style={{marginTop: "20px"}}>
    </div>
  </section>
  <section id={"analysis"} className={"page"}>
    <div className={"hero"} style={{background: "linear-gradient(135deg, var(--primary), #1e40af)", padding: "20px"}}>
      <label className={"label-sm"} style={{color: "rgba(255,255,255,0.8)"}}>
        Savings Score (0–100%)
      </label>
      <h1 id={"proScore"} style={{fontSize: "48px", margin: "10px 0"}}>
        --
      </h1>
      <div id={"proStatus"} style={{fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px"}}>
        
                    Initializing Engine...
      </div>
    </div>
    <div className={"card"} style={{marginTop: "-20px"}}>
      <div className={"f-grid"}>
        <select id={"aYear"} onChange={(event) => { window.runProAnalysis(); }}>
        </select>
        <select id={"aMonth"} onChange={(event) => { window.runProAnalysis(); }}>
        </select>
      </div>
    </div>
    <div className={"f-grid"}>
      <div className={"card"}>
        <label className={"label-sm"}>
          Savings Ratio
        </label>
        <div id={"anSaveRate"} style={{fontSize: "20px", fontWeight: "800"}}>
          0%
        </div>
        <small id={"saveBench"} style={{color: "var(--sub)"}}>
          vs 20% Goal
        </small>
      </div>
      <div className={"card"}>
        <label className={"label-sm"}>
          Avg. Daily Expenses
        </label>
        <div id={"anBurn"} style={{fontSize: "20px", fontWeight: "800", color: "var(--expense)"}}>
          0
        </div>
        <small style={{color: "var(--sub)"}}>
          LKR / Day
        </small>
      </div>
    </div>
    <div className={"card"}>
      <label className={"label-sm"} style={{color: "var(--primary)"}}>
          Daily Balance Allowance
      </label>
      <div style={{display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--border)", paddingBottom: "8px"}}>
          <span style={{fontSize: "12px", fontWeight: "600"}}>
            1. Main + Saving Balance
          </span>
          <b id={"anDailyTotal"} style={{fontSize: "16px", color: "var(--income)"}}>
            0
          </b>
        </div>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--border)", paddingBottom: "8px"}}>
          <span style={{fontSize: "12px", color: "var(--sub)"}}>
            2. From Main Only
          </span>
          <b id={"anDailyMain"} style={{fontSize: "14px"}}>
            0
          </b>
        </div>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{fontSize: "12px", color: "var(--sub)"}}>
            3. From Saving Only
          </span>
          <b id={"anDailySave"} style={{fontSize: "14px"}}>
            0
          </b>
        </div>
      </div>
      <center>
        <small id={"daysLeftNote"} style={{display: "block", marginTop: "10px", fontSize: "10px", color: "var(--sub)", textTransform: "none"}}>
        </small>
      </center>
    </div>
    <div className={"card"}>
      <label className={"label-sm"}>
        Expense Concentration
      </label>
      <div id={"anChart"} style={{marginTop: "15px"}}>
      </div>
    </div>
    <div className={"card"} style={{padding: "20px 15px"}}>
      <label className={"label-sm"} style={{color: "var(--primary)", marginBottom: "15px"}}>
        Subcategory
                    Distribution
      </label>
      <div className={"pie-wrapper"}>
        <small className={"label-sm"} style={{fontSize: "10px", color: "var(--text)"}}>
          Overall History
        </small>
        <div id={"pieAll"} className={"pie-chart big"}>
        </div>
        <div id={"legendAll"} className={"pie-legend"}>
        </div>
      </div>
      <div className={"pie-sub-grid"}>
        <div className={"pie-wrapper"}>
          <small className={"label-sm"} style={{fontSize: "8px"}}>
            Selected Month
          </small>
          <div id={"pieSelected"} className={"pie-chart small"}>
          </div>
          <div id={"legendSelected"} className={"pie-legend"}>
          </div>
        </div>
        <div className={"pie-wrapper"}>
          <small className={"label-sm"} style={{fontSize: "8px"}}>
            Current Month
          </small>
          <div id={"pieMonth"} className={"pie-chart small"}>
          </div>
          <div id={"legendMonth"} className={"pie-legend"}>
          </div>
        </div>
      </div>
    </div>
    <div className={"card"}>
      <h3 style={{marginTop: "0", fontSize: "14px", color: "var(--primary)"}}>
        PRO INSIGHTS
      </h3>
      <div id={"anInsights"} style={{fontSize: "13px", lineHeight: "1.5"}}>
      </div>
    </div>
  </section>
  <section id={"stats"} className={"page"}>
    <div className={"card forecast-card"}>
      <label className={"label-sm"}>
        Monthly Forecast
      </label>
      <div id={"monthlyForecastValue"} className={"status-pill pill-neutral"}>
        
                    Analyzing...
                
      </div>
      <div style={{marginTop: "10px"}}>
        <small style={{color: "var(--sub)", fontSize: "11px"}}>
          
                        Projected month-end net activity from recorded income and expenses
                    
        </small>
      </div>
    </div>
    <div id={"reportSummary"} style={{display: "none", background: "var(--accent)", padding: "15px", borderRadius: "15px", marginBottom: "15px", border: "1px solid var(--border)"}}>
      <div style={{display: "flex", justifyContent: "space-between", marginBottom: "8px"}}>
        <span style={{fontSize: "12px", color: "var(--sub)"}}>
          Total Income:
        </span>
        <b id={"repInc"} style={{color: "var(--income)"}}>
          0
        </b>
      </div>
      <div style={{display: "flex", justifyContent: "space-between", marginBottom: "8px"}}>
        <span style={{fontSize: "12px", color: "var(--sub)"}}>
          Total Expense:
        </span>
        <b id={"repExp"} style={{color: "var(--expense)"}}>
          0
        </b>
      </div>
      <div style={{display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--border)"}}>
        <span style={{fontSize: "12px", fontWeight: "700"}}>
          Net Balance:
        </span>
        <b id={"repNet"}>
          0
        </b>
      </div>
    </div>
    <div className={"card"}>
      <label className={"label-sm"}>
        Filters
      </label>
      <div className={"f-grid"} style={{gap: "8px"}}>
        <select id={"fYear"} onChange={(event) => { window.runReport(); }}>
        </select>
        <select id={"fMonth"} onChange={(event) => { window.runReport(); }}>
        </select>
        <select id={"fType"} onChange={(event) => { window.runReport(); }}>
          <option value={""}>
            All Types
          </option>
          <option>
            Expense
          </option>
          <option>
            Income
          </option>
        </select>
        <select id={"fAcc"} onChange={(event) => { window.runReport(); }}>
          <option value={""}>
            All Accounts
          </option>
          <option>
            Main
          </option>
          <option>
            Saving
          </option>
          <option>
            Credit Card
          </option>
          <option>
            Crypto
          </option>
        </select>
        <input className={"full"} type={"text"} id={"fKey"} placeholder={"Keyword Search..."} onInput={(event) => { window.runReport(); }} />
      </div>
      <button data-react-click={true} onClick={(event) => { window.exportCSV(); }} className={"btn-s"} style={{marginTop: "15px", width: "100%"}}>
        Download CSV
      </button>
      <div id={"reportList"} style={{marginTop: "20px"}}>
      </div>
    </div>
  </section>
  <section id={"setup"} className={"page"}>
    <div className={"card"}>
      <h3>
        Opening Balances
      </h3>
      <small style={{display: "block", color: "var(--sub)", marginBottom: "12px", lineHeight: "1.5"}}>
        Set balances immediately before the earliest saved transaction. Account balances add recorded activity through today; crypto value is holdings × the USDT/LKR rate.
      </small>
      <div className={"f-grid"}>
        <div>
          <label className={"label-sm"}>
            Main (LKR)
          </label>
          <input type={"number"} id={"cMain"} className={"amt-input"} />
        </div>
        <div>
          <label className={"label-sm"}>
            Saving (LKR)
          </label>
          <input type={"number"} id={"cSave"} className={"amt-input"} />
        </div>
        <div>
          <label className={"label-sm"}>
            CC Limit (LKR)
          </label>
          <input type={"number"} id={"sCCL"} className={"amt-input"} />
        </div>
        <div>
          <label className={"label-sm"}>
            CC Available (LKR)
          </label>
          <input type={"number"} id={"sCCS"} className={"amt-input"} />
        </div>
        <div>
          <label className={"label-sm"}>
            USDT/LKR Rate
          </label>
          <input type={"number"} id={"cRate"} className={"amt-input"} />
        </div>
        <div>
          <label className={"label-sm"}>
            Crypto Holdings (USDT)
          </label>
          <input type={"number"} id={"cCry"} className={"amt-input"} />
        </div>
      </div>
      <button className={"btn-p"} data-react-click={true} onClick={(event) => { window.saveConf(); }}>
        Save Opening Balances
      </button>
    </div>
    <div className={"card"}>
      <h3>
        Manage Vehicles
      </h3>
      <div id={"vehicleList"}>
      </div>
      <div style={{background: "var(--bg)", padding: "15px", borderRadius: "15px", marginTop: "10px"}}>
        <input type={"text"} id={"vReg"} placeholder={"Reg: BDD 0471"} />
        <input type={"text"} id={"vMake"} placeholder={"Model: Honda Hornet"} style={{marginTop: "8px"}} />
        <button className={"btn-p"} data-react-click={true} onClick={(event) => { window.addVehicle(); }}>
          Add Vehicle
        </button>
      </div>
    </div>
    <div className={"card"} style={{border: "1px solid var(--border)"}}>
      <label className={"label-sm"} style={{color: "var(--primary)", marginBottom: "15px", display: "block"}}>
        
                    SECURITY SETTINGS
                
      </label>
      <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
        <input type={"password"} id={"oldPass"} placeholder={"Current Password"} />
        <input type={"password"} id={"newPass"} placeholder={"New Password"} />
        <button className={"btn-p"} data-react-click={true} onClick={(event) => { window.updateCredentials(); }} style={{width: "100%", marginTop: "5px"}}>
          
                        Update Password
                    
        </button>
      </div>
    </div>
  </section>
  <div className={"nav-bar"}>
    <div className={"nav-item active"} data-react-click={true} onClick={(event) => { window.nav('dash', event.currentTarget); }}>
      <i>
        🏠
      </i>
      Dash
    </div>
    <div className={"nav-item"} data-react-click={true} onClick={(event) => { window.nav('entry', event.currentTarget); }}>
      <i>
        💸
      </i>
      Activity
    </div>
    <div className={"nav-item"} data-react-click={true} onClick={(event) => { window.nav('analysis', event.currentTarget); }}>
      <i>
        🧠
      </i>
      Engine
    </div>
    <div className={"nav-item"} data-react-click={true} onClick={(event) => { window.nav('assets', event.currentTarget); }}>
      <i>
        📦
      </i>
      Assets
    </div>
    <div className={"nav-item"} data-react-click={true} onClick={(event) => { window.nav('stats', event.currentTarget); }}>
      <i>
        📊
      </i>
      Stats
    </div>
    <div className={"nav-item"} data-react-click={true} onClick={(event) => { window.nav('setup', event.currentTarget); }}>
      <i>
        ⚙️
      </i>
      Setup
    </div>
  </div>
    </div>
    </div>
  );
}
