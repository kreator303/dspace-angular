import { MissingTranslationHandlerParams } from '@ngx-translate/core';

import {
  humanizeFilterName,
  MissingTranslationHelper,
} from './missing-translation.helper';

describe('humanizeFilterName', () => {
  it('capitalizes a single-word filter name', () => {
    expect(humanizeFilterName('technique')).toBe('Technique');
    expect(humanizeFilterName('keyword')).toBe('Keyword');
    expect(humanizeFilterName('person')).toBe('Person');
  });

  it('splits camelCase into Title-cased words', () => {
    expect(humanizeFilterName('dateCreated')).toBe('Date Created');
    expect(humanizeFilterName('dateIssued')).toBe('Date Issued');
  });

  it('splits underscore/hyphen separators', () => {
    expect(humanizeFilterName('has_content_in_original_bundle')).toBe(
      'Has Content In Original Bundle',
    );
    expect(humanizeFilterName('some-filter')).toBe('Some Filter');
  });
});

describe('MissingTranslationHelper', () => {
  let helper: MissingTranslationHelper;

  beforeEach(() => {
    helper = new MissingTranslationHelper();
  });

  const paramsFor = (
    key: string,
    interpolateParams?: object,
  ): MissingTranslationHandlerParams =>
    ({ key, interpolateParams } as MissingTranslationHandlerParams);

  it('derives a facet header label from a missing .head key', () => {
    expect(helper.handle(paramsFor('search.filters.filter.technique.head'))).toBe(
      'Technique',
    );
    expect(
      helper.handle(paramsFor('search.filters.filter.dateCreated.head')),
    ).toBe('Date Created');
  });

  it('derives the in-facet search box .placeholder as the noun', () => {
    expect(
      helper.handle(paramsFor('search.filters.filter.technique.placeholder')),
    ).toBe('Technique');
  });

  it('derives the in-facet search box .label as "Search <noun>"', () => {
    expect(
      helper.handle(paramsFor('search.filters.filter.technique.label')),
    ).toBe('Search Technique');
    expect(
      helper.handle(paramsFor('search.filters.filter.dateCreated.label')),
    ).toBe('Search Date Created');
  });

  it('maps range-filter min/max keys to fixed labels, not the humanized name', () => {
    expect(
      helper.handle(paramsFor('search.filters.filter.dateCreated.min.label')),
    ).toBe('Start');
    expect(
      helper.handle(paramsFor('search.filters.filter.dateCreated.max.label')),
    ).toBe('End');
    expect(
      helper.handle(paramsFor('search.filters.filter.dateCreated.min.placeholder')),
    ).toBe('Minimum');
  });

  it('still prefers an explicit default interpolation param', () => {
    expect(
      helper.handle(
        paramsFor('search.filters.filter.technique.head', { default: 'Method' }),
      ),
    ).toBe('Method');
  });

  it('falls back to the raw key for non-facet keys', () => {
    expect(helper.handle(paramsFor('some.other.missing.key'))).toBe(
      'some.other.missing.key',
    );
  });
});
