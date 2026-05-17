import {
  LuCheck,
  LuChevronRight,
  LuExternalLink,
  LuFilePenLine,
  LuHeadphones,
  LuMessageCircleMore,
  LuPlay,
} from "react-icons/lu";

function HelpCenterContent() {
  const helpCards = [
    {
      title: "Help center",
      subtitle: "Technical information",
      icon: LuHeadphones,
      tone: "mint",
    },
    {
      title: "Feature Request",
      subtitle: "",
      icon: LuMessageCircleMore,
      tone: "aqua",
    },
    {
      title: "From our blog",
      subtitle: "",
      icon: LuFilePenLine,
      tone: "rose",
    },
  ];

  return (
    <section className="help-center-page">
      <div className="help-center__cards">
        {helpCards.map((card) => {
          const Icon = card.icon;

          return (
            <button type="button" className="help-center-card" key={card.title}>
              <span className={`help-center-card__icon help-center-card__icon--${card.tone}`}>
                <Icon />
              </span>
              <span className="help-center-card__copy">
                <strong>{card.title}</strong>
                {card.subtitle ? <span>{card.subtitle}</span> : null}
              </span>
              <LuChevronRight className="help-center-card__arrow" />
            </button>
          );
        })}
      </div>

      <section className="help-center-mentorship">
        <div className="help-center-mentorship__visual" aria-hidden="true">
          <div className="help-center-mentorship__photo help-center-mentorship__photo--top" />
          <div className="help-center-mentorship__photo help-center-mentorship__photo--bottom" />
          <div className="help-center-mentorship__chat">
            <strong>AUTO-DS</strong>
            <span>Hey John, do you find the right products for you?</span>
            <em>Yes! You always helped me a lot!</em>
            <span>Great, we are here for you.</span>
          </div>
        </div>

        <div className="help-center-mentorship__copy">
          <h2>AutoDS` 1-on-1<br />Dropshipping Mentorships</h2>
          <p>Get personal help from expert dropshippers</p>
        </div>

        <button type="button" className="help-center-mentorship__cta">
          START NOW
        </button>
      </section>

      <div className="help-center-links">
        <button type="button">
          <LuPlay />
          <span>YouTube Channel</span>
        </button>
        <button type="button">
          <LuMessageCircleMore />
          <span>Facebook community</span>
        </button>
        <button type="button">
          <LuExternalLink />
          <span>Telegram group</span>
        </button>
        <button type="button">
          <LuCheck />
          <span>System status</span>
        </button>
      </div>
    </section>
  );
}

export default HelpCenterContent;
