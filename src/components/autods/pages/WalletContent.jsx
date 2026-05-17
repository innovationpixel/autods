import {
  LuCheck,
  LuClock3,
  LuExternalLink,
  LuPlay,
} from "react-icons/lu";

function WalletContent() {
  const walletBenefits = [
    "Save up to 1.5% on your AutoDS subscription and managed services",
    "Receive your dropshipping sales to a Payoneer issued USD bank account with no landing fee",
    "Cover your business expenses using the Payoneer card for FREE",
    "Save up to 2% on currency conversions",
    "Earn up to 1% cashback on card spend/PPC",
  ];

  return (
    <section className="wallet-page">
      <div className="wallet-card">
        <div className="wallet-card__brand-row">
          <div className="wallet-brand wallet-brand--autods">AUTO-DS-</div>
          <div className="wallet-brand wallet-brand--payoneer">
            <span className="wallet-brand__ring" aria-hidden="true" />
            <span>Payoneer</span>
          </div>
        </div>

        <div className="wallet-card__body">
          <div className="wallet-benefits">
            <h2>Take advantage of Payoneer's exclusive pricing structure with your AutoDS wallet</h2>
            <ul>
              {walletBenefits.map((benefit) => (
                <li key={benefit}>
                  <LuCheck />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="wallet-video" role="img" aria-label="AutoDS Wallet video preview">
            <div className="wallet-video__scrim" />
            <div className="wallet-video__title">
              <span className="wallet-video__channel">DS</span>
              <div>
                <strong>AutoDS Wallet - October 2023 Fees Update</strong>
                <span>AutoDS - Build Your Online Income</span>
              </div>
            </div>
            <button type="button" className="wallet-video__play" aria-label="Play wallet video">
              <LuPlay />
            </button>
            <div className="wallet-video__bottom">
              <div className="wallet-video__tools">
                <button type="button" aria-label="Share video">
                  <LuExternalLink />
                </button>
                <button type="button" aria-label="Watch later">
                  <LuClock3 />
                </button>
              </div>
              <span>
                Watch on <strong>YouTube</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="wallet-card__footer">
          <button type="button" className="wallet-card__primary-btn">
            Sign Up to Payoneer
          </button>
          <button type="button" className="wallet-card__link-btn">
            I already have an account
          </button>
        </div>
      </div>
    </section>
  );
}

export default WalletContent;
