import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Solve the Chaos',
    Svg: require('@site/static/img/compass.svg').default,
    description: (
      <>
        Express.js is powerful but unopinionated. We provide the missing framework: a clear, consistent structure (Controllers, Services, Repositories) for scalable projects.
      </>
    ),
  },
  {
    title: 'Production Focus',
    Svg: require('@site/static/img/cloud.svg').default,
    description: (
      <>
        Move beyond simple CRUD. Learn essential real-world concepts like Dockerization, CI/CD pipelines, robust error handling, and security hardening from day one.
      </>
    ),
  },
  {
    title: 'End-to-End Backend',
    Svg: require('@site/static/img/link.svg').default,
    description: (
      <>
        Gain expert-level implementation knowledge for architecting, securing, testing, and deploying robust API services
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
