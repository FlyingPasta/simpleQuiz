let quizData = {};
let currentQuiz = null;

let currentGenre = "";
let hintIndex = 0;

// 回答後、Enterで次の問題へ進める状態か
let isWaitingNext = false;


// ========================================
// JSON読み込み
// ========================================

fetch("quizzes.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("クイズデータを読み込めませんでした");
    }

    return response.json();
  })
  .then(data => {
    quizData = data;

    createGenreSelection();
  })
  .catch(error => {
    console.error(error);

    document.getElementById("genre-selection").innerHTML =
      "<p>クイズデータの読み込みに失敗しました</p>";
  });


// ========================================
// ジャンル選択を生成
// ========================================

function createGenreSelection() {
  const genreContainer = document.getElementById("genre-selection");

  // 保存されているジャンルを取得
  const savedGenres =
    JSON.parse(localStorage.getItem("selectedGenres") || "[]");

  genreContainer.innerHTML = "";

  Object.keys(quizData).forEach(genre => {

    const label = document.createElement("label");

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.value = genre;

    // 前回の選択状態を復元
    checkbox.checked = savedGenres.includes(genre);

    // 変更されたら保存
    checkbox.addEventListener("change", saveSelectedGenres);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(genre));

    genreContainer.appendChild(label);
  });
}


// ========================================
// ジャンルの選択状態を保存
// ========================================

function saveSelectedGenres() {

  const selectedGenres =
    Array.from(
      document.querySelectorAll(
        '#genre-selection input[type="checkbox"]:checked'
      )
    ).map(input => input.value);

  localStorage.setItem(
    "selectedGenres",
    JSON.stringify(selectedGenres)
  );
}


// ========================================
// 「ランダムに出題」ボタン
// ========================================

document
  .getElementById("start-button")
  .addEventListener("click", loadQuiz);


// ========================================
// クイズを表示
// ========================================

function loadQuiz() {

  const checkedGenres =
    Array.from(
      document.querySelectorAll(
        '#genre-selection input[type="checkbox"]:checked'
      )
    ).map(input => input.value);


  if (checkedGenres.length === 0) {

    alert("ジャンルを1つ以上選択してください");

    return;
  }


  // 選択されたジャンルからランダム選択

  currentGenre =
    checkedGenres[
    Math.floor(Math.random() * checkedGenres.length)
    ];


  const questions = quizData[currentGenre];


  // そのジャンルの問題からランダム選択

  currentQuiz =
    questions[
    Math.floor(Math.random() * questions.length)
    ];


  // 新しい問題なのでリセット

  hintIndex = 0;

  isWaitingNext = false;


  const container =
    document.getElementById("quiz-container");


  container.innerHTML = `

    <div class="quiz-header">

      <span class="genre-label">
        ${escapeHtml(currentGenre)}
      </span>

    </div>


    <div class="question">
      ${escapeHtml(currentQuiz.question)}
    </div>


    <div class="answer-area">

      <input
        type="text"
        id="user-answer"
        placeholder="答えを入力"
        autocomplete="off"
      >

    </div>


    <div class="button-group">

      <button
        id="check-button"
        class="primary-button"
      >
        答え合わせ
      </button>


      <button
        id="hint-button"
        class="secondary-button"
      >
        ヒントを見る
      </button>

    </div>


    <!-- ヒント -->

    <div
      id="hint"
      class="hint-area"
    ></div>


    <!-- 結果 -->

    <div
      id="result"
      class="result-area"
    ></div>

    <p id="notes">※ポケモンを答える際は基本ポケモン名のみ。<br>メガシンカとゲンシカイキはそれぞれメガ/ゲンシを付ける。</p>

  `;


  // ボタンイベント

  document
    .getElementById("check-button")
    .addEventListener("click", checkAnswer);


  document
    .getElementById("hint-button")
    .addEventListener("click", showHint);


  // 入力欄

  const answerInput =
    document.getElementById("user-answer");


  answerInput.focus();


  // Enterキー

  answerInput.addEventListener("keydown", event => {

    if (event.key !== "Enter") {
      return;
    }


    event.preventDefault();


    if (isWaitingNext) {

      loadQuiz();

    } else {

      checkAnswer();

    }

  });
}


// ========================================
// 回答の正規化
// ========================================

function normalizeAnswer(answer) {

  return answer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}


// ========================================
// 答え合わせ
// ========================================

function checkAnswer() {

  if (!currentQuiz) {
    return;
  }


  const input =
    document.getElementById("user-answer");


  const userAnswer =
    input.value.trim();


  const resultDiv =
    document.getElementById("result");


  if (userAnswer === "") {

    resultDiv.innerHTML = `
      <div class="warning">
        答えを入力してください
      </div>
    `;

    return;
  }


  // answerが配列でも文字列でも処理できるようにする

  const answers =
    Array.isArray(currentQuiz.answer)
      ? currentQuiz.answer
      : [currentQuiz.answer];


  const normalizedUserAnswer =
    normalizeAnswer(userAnswer);


  // どれか1つでも一致すれば正解

  const isCorrect =
    answers.some(answer => {

      return (
        normalizeAnswer(answer)
        === normalizedUserAnswer
      );

    });


  // ========================================
  // 正解
  // ========================================

  if (isCorrect) {

    showCorrectAnswer();

    isWaitingNext = true;

    return;
  }


  // ========================================
  // 不正解
  // ========================================

  resultDiv.innerHTML = `
    <div class="incorrect">
      不正解…
    </div>
  `;


  // ギブアップボタンを追加

  if (!document.getElementById("give-up-button")) {

    const giveUpButton =
      document.createElement("button");

    giveUpButton.id = "give-up-button";

    giveUpButton.className = "give-up-button";

    giveUpButton.textContent =
      "ギブアップ";

    giveUpButton.addEventListener(
      "click",
      giveUp
    );


    document
      .getElementById("quiz-container")
      .appendChild(giveUpButton);
  }
}


// ========================================
// 正解表示
// ========================================

function showCorrectAnswer() {

  const resultDiv =
    document.getElementById("result");


  resultDiv.innerHTML = `
    <div class="correct">
      正解！🎉
    </div>

    <div class="answer-display">
      答え：${escapeHtml(currentQuiz.answer[0])}
    </div>

    ${currentQuiz.explanation
      ? `<div class="explanation"><div class="explanation-title">解説</div>${escapeHtml(currentQuiz.explanation)}</div>`: ""
    }

    <div class="next-message">
      Enterキーで次の問題へ
    </div>
  `;


  // ギブアップボタンがあれば削除

  const giveUpButton =
    document.getElementById("give-up-button");

  if (giveUpButton) {
    giveUpButton.remove();
  }
}


// ========================================
// ギブアップ
// ========================================

function giveUp() {

  const resultDiv =
    document.getElementById("result");


  // 答え

  const answers =
    Array.isArray(currentQuiz.answer)
      ? currentQuiz.answer
      : [currentQuiz.answer];


  resultDiv.innerHTML = `
    <div class="give-up-result">
      正解は
      <strong>
        ${escapeHtml(answers[0])}
      </strong>
      でした
    </div>

    ${currentQuiz.explanation
      ? `
          <div class="explanation">
            <div class="explanation-title">
              解説
            </div>

            ${escapeHtml(currentQuiz.explanation)}
          </div>
        `
      : ""
    }

    <div class="next-message">
      Enterキーで次の問題へ
    </div>
  `;


  const giveUpButton =
    document.getElementById("give-up-button");


  if (giveUpButton) {
    giveUpButton.remove();
  }


  // Enterで次の問題へ

  isWaitingNext = true;
}


// ========================================
// ヒント表示
// ========================================

function showHint() {

  if (!currentQuiz) {
    return;
  }


  const hintDiv =
    document.getElementById("hint");


  const hintButton =
    document.getElementById("hint-button");


  // ヒントがない場合

  if (!currentQuiz.hint) {
    return;
  }


  const hints =
    Array.isArray(currentQuiz.hint)
      ? currentQuiz.hint
      : [currentQuiz.hint];


  // すべて表示済み

  if (hintIndex >= hints.length) {
    return;
  }


  // ヒントを追加

  const hintElement =
    document.createElement("div");


  hintElement.className =
    "hint-item";


  hintElement.textContent =
    `ヒント${hintIndex + 1}：${hints[hintIndex]}`;


  hintDiv.appendChild(hintElement);


  hintIndex++;


  // 最後のヒントを表示した場合

  if (hintIndex >= hints.length) {

    hintButton.disabled = true;

  }
}


// ========================================
// HTMLエスケープ
// ========================================

function escapeHtml(value) {

  const div =
    document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
}
