import React from 'react';
import styles from './Features.module.css';
// Make sure you have an image named features-image.png in your assets folder
import featuresImage from '../../assets/features-image.png';

const Features = () => {
  return (
    <section className={styles.features}>
      <img src={featuresImage} alt="Report, Review, Resolve steps" className={styles.image} />
    </section>
  );
};

export default Features;
