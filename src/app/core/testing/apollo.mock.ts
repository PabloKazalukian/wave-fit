import { of } from 'rxjs';

export const apolloMock = {
    query: jasmine.createSpy('apollo.query').and.returnValue(of({ data: null })),
    mutate: jasmine.createSpy('apollo.mutate').and.returnValue(of({ data: null })),
    watchQuery: jasmine
        .createSpy('apollo.watchQuery')
        .and.returnValue({ valueChanges: of({ data: null }) }),
    subscribe: jasmine.createSpy('apollo.subscribe').and.returnValue(of({ data: null })),
};
