import staticParams from './static-params.json';

export function companyStaticParams(): Array<{ slug: string }> {
  return staticParams.companies;
}

export function domainStaticParams(): Array<{ slug: string }> {
  return staticParams.domains;
}

export function placeStaticParams(): Array<{ place: string }> {
  return staticParams.places.length ? staticParams.places : [{ place: 'remote-robotics-jobs' }];
}
