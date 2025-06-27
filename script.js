let quizData = {};
let currentQuiz = null;
let isWaitingNext = false;

// JSON読み込み & ジャンル表示
fetch('quizzes.json')
  .then(res => res.json())
  .then(data => {
    quizData = data;

    const savedGenres = JSON.parse(localStorage.getItem("selectedGenres") || "[]");

    const genreContainer = document.getElementById('genre-selection');
    genreContainer.innerHTML = Object.keys(data).map(genre => {
      const checked = savedGenres.includes(genre) ? 'checked' : '';
      return `
        <label>
          <input type="checkbox" value="${genre}" ${checked}>
          ${genre}
        </label>
      `;
    }).join('');

    // 変更時にローカルストレージへ保存
    genreContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', saveSelectedGenres);
    });
  });

function saveSelectedGenres() {
  const selected = Array.from(document.querySelectorAll('#genre-selection input:checked'))
    .map(input => input.value);
  localStorage.setItem("selectedGenres", JSON.stringify(selected));
}

// ランダムにクイズを出題
function loadQuiz() {
  const checkedGenres = Array.from(document.querySelectorAll('#genre-selection input:checked')).map(input => input.value);
  if (checkedGenres.length === 0) {
    alert("ジャンルを選択してください。");
    return;
  }

  const selectedGenre = checkedGenres[Math.floor(Math.random() * checkedGenres.length)];
  const questions = quizData[selectedGenre];
  currentQuiz = questions[Math.floor(Math.random() * questions.length)];

  const container = document.getElementById('quiz-container');
  container.innerHTML = `
    <p><strong>ジャンル:</strong> ${selectedGenre}</p>
    <p>${currentQuiz.question}</p>
    <input type="text" id="user-answer" placeholder="ここに入力">
    <button onclick="checkAnswer()">答え合わせ</button>
    <button onclick="showHint()">ヒントを見る</button>
    <div id="hint" style="margin-top:10px;"></div>
    <div id="result" style="margin-top:10px;"></div>
  `;

  isWaitingNext = false;
  const answerInput = document.getElementById('user-answer');
  answerInput.focus();

  answerInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (isWaitingNext) {
        isWaitingNext = false;
        loadQuiz();  // 次の問題へ
      } else {
        checkAnswer();  // 答え合わせ
      }
    }
  });

}

function checkAnswer() {
  const userAnswer = document.getElementById('user-answer').value.trim();
  const resultDiv = document.getElementById('result');

  if (userAnswer === "") {
    alert("答えを入力してください。");
    return;
  }

  if (userAnswer === currentQuiz.answer) {
    const explanation = currentQuiz.explanation || "";
    resultDiv.innerHTML = `
      <div class="correct">正解！🎉</div>
      ${explanation ? `<div class="explanation">${explanation}</div>` : ""}
    `;
    const giveUpBtn = document.getElementById('give-up-button');
    if (giveUpBtn) giveUpBtn.remove();
    isWaitingNext = true;
  } else {
    resultDiv.innerHTML = `<div class="incorrect">不正解…</div>`;
    if (!document.getElementById('give-up-button')) {
      const btn = document.createElement('button');
      btn.id = 'give-up-button';
      btn.textContent = 'ギブアップ';
      btn.onclick = giveUp;
      document.getElementById('quiz-container').appendChild(btn);
    }
  }
}

function giveUp() {
  const resultDiv = document.getElementById('result');
  const explanation = currentQuiz.explanation || "";

  resultDiv.innerHTML = `
    <div class="incorrect">正解は「${currentQuiz.answer}」</div>
    ${explanation ? `<div class="explanation">${explanation}</div>` : ""}
  `;

  const giveUpBtn = document.getElementById('give-up-button');
  if (giveUpBtn) giveUpBtn.remove();

  isWaitingNext = true;
}

// ヒント表示機能
function showHint() {
  const hintDiv = document.getElementById('hint');
  if (currentQuiz && currentQuiz.hint) {
    hintDiv.textContent = `ヒント：${currentQuiz.hint}`;
  } else {
    hintDiv.textContent = "この問題にはヒントがありません。";
  }
}

