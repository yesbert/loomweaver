globalThis.askBeforeClosing = function (texts) {
  return new Promise(function (resolve) {
    const overlay = document.createElement('div');
    overlay.className = 'veto';
    overlay.dataset.testid = 'sandbox-veto-overlay';

    const question = document.createElement('p');
    question.className = 'veto-question';
    question.textContent = texts.question;

    const buttons = document.createElement('div');
    buttons.className = 'veto-buttons';
    buttons.append(
      answerButton('sandbox-veto-keep', texts.keep, false),
      answerButton('sandbox-veto-allow', texts.allow, true),
    );

    overlay.append(question, buttons);
    document.body.append(overlay);

    function answerButton(testid, label, mayClose) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.testid = testid;
      button.textContent = label;
      button.className =
        'lw-btn ' + (mayClose ? 'lw-btn--danger' : 'lw-btn--default');
      button.addEventListener('click', function () {
        overlay.remove();
        resolve(mayClose);
      });
      return button;
    }
  });
};
