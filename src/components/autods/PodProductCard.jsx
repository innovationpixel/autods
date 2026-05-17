function PodProductCard({ item }) {
  return (
    <article className={`pod-product-card ${item.advanced ? "pod-product-card--advanced" : ""}`}>
      <div className="pod-product-card__media">
        <img className="pod-product-card__image" src={item.image} alt={item.title} />
        <span className="pod-product-card__logo">AUTO-DS</span>
        {item.advanced ? (
          <div className="pod-product-card__advanced">
            <span>
              This product requires designs created by advanced tools, such as Photoshop.
              You can download an example file from here.
            </span>
            <span className="pod-product-card__ps">Ps</span>
          </div>
        ) : null}
      </div>

      <div className="pod-product-card__body">
        <h3 className="pod-product-card__title">{item.title}</h3>
        <div className="pod-product-card__price">{item.price}</div>
        <button type="button" className="pod-product-card__edit-btn">
          Edit Product
        </button>
      </div>
    </article>
  );
}

export default PodProductCard;
