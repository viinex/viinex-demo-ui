import { ViinexUiPage } from './app.po';

describe('viinex-ui App', () => {
  let page: ViinexUiPage;

  beforeEach(() => {
    page = new ViinexUiPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
