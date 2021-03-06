"use strict";

const PATH = getRootDirectory(gTestPath).replace("chrome://mochitests/content", "http://example.com");
const TEST_PAGE = PATH + "file_triggeringprincipal_oa.html";
const DUMMY_PAGE = PATH + "empty_file.html";

add_task(function* test_principal_right_click_open_link_in_new_private_win() {
  yield BrowserTestUtils.withNewTab(TEST_PAGE, function*(browser) {
    let promiseNewWindow = BrowserTestUtils.waitForNewWindow(true, DUMMY_PAGE);

    // simulate right-click open link in new private window
    BrowserTestUtils.waitForEvent(document, "popupshown", false, event => {
      document.getElementById("context-openlinkprivate").doCommand();
      event.target.hidePopup();
      return true;
    });
    BrowserTestUtils.synthesizeMouseAtCenter("#checkPrincipalOA",
                                             { type: "contextmenu", button: 2 },
                                             gBrowser.selectedBrowser);
    let privateWin = yield promiseNewWindow;

    yield ContentTask.spawn(privateWin.gBrowser.selectedBrowser, {DUMMY_PAGE, TEST_PAGE}, function*({DUMMY_PAGE, TEST_PAGE}) { // eslint-disable-line

      let channel = content.document.docShell.currentDocumentChannel;
      is(channel.URI.spec, DUMMY_PAGE,
         "sanity check to ensure we check principal for right URI");

      let triggeringPrincipal = channel.loadInfo.triggeringPrincipal;
      ok(triggeringPrincipal.isCodebasePrincipal,
         "sanity check to ensure principal is a codebasePrincipal");
      is(triggeringPrincipal.URI.spec, TEST_PAGE,
         "test page must be the triggering page");
      is(triggeringPrincipal.originAttributes.privateBrowsingId, 1,
         "must have correct privateBrowsingId");
    });
    yield BrowserTestUtils.closeWindow(privateWin);
  });
});
