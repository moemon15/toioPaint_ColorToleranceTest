document.addEventListener('DOMContentLoaded', () => {
    // キャンバス要素の取得
    const imageCanvas = document.getElementById('imageCanvas');
    const drawCanvas = document.getElementById('drawCanvas');
    const resultCanvas = document.getElementById('resultCanvas');
    const imageCtx = imageCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    const resultCtx = resultCanvas.getContext('2d');

    // 状態管理
    const state = {
        modelColor: { r: 74, g: 74, b: 74 },
        userColor: { r: 80, g: 80, b: 80 },
        tolerance: 100
    };

    // キャンバスの初期化
    function initializeCanvases() {
        const canvases = [imageCanvas, drawCanvas, resultCanvas];
        canvases.forEach(canvas => {
            canvas.width = 300;
            canvas.height = 200;
        });
        updateCanvases();
    }

    // キャンバスの更新
    function updateCanvases() {
        // キャンバスのクリア
        imageCtx.clearRect(0, 0, 300, 200);
        drawCtx.clearRect(0, 0, 300, 200);

        // お手本画像の描画
        imageCtx.fillStyle = `rgb(${state.modelColor.r}, ${state.modelColor.g}, ${state.modelColor.b})`;
        imageCtx.fillRect(60, 40, 190, 110);

        // ユーザー描画のシミュレーション
        drawCtx.fillStyle = `rgb(${state.userColor.r}, ${state.userColor.g}, ${state.userColor.b})`;
        drawCtx.fillRect(60, 40, 190, 110);

        calculateSimilarity();
    }

    // 類似度の計算
    function calculateSimilarity() {
        const imageData = imageCtx.getImageData(0, 0, 300, 200);
        const userData = drawCtx.getImageData(0, 0, 300, 200);
        const resultData = new ImageData(300, 200);

        let matchCount = 0;
        let modelColorCount = 0;
        let userDrawnPixelCount = 0;

        // ピクセルごとの比較
        for (let i = 0; i < userData.data.length; i += 4) {
            const userA = userData.data[i + 3];

            if (userA !== 0) {
                userDrawnPixelCount++;

                const modelR = imageData.data[i];
                const modelG = imageData.data[i + 1];
                const modelB = imageData.data[i + 2];

                const colorDistanceModel = Math.sqrt(
                    Math.pow(modelR - state.modelColor.r, 2) +
                    Math.pow(modelG - state.modelColor.g, 2) +
                    Math.pow(modelB - state.modelColor.b, 2)
                );

                if (colorDistanceModel <= state.tolerance) {
                    modelColorCount++;

                    const userR = userData.data[i];
                    const userG = userData.data[i + 1];
                    const userB = userData.data[i + 2];

                    const colorDistanceUser = Math.sqrt(
                        Math.pow(userR - modelR, 2) +
                        Math.pow(userG - modelG, 2) +
                        Math.pow(userB - modelB, 2)
                    );

                    if (colorDistanceUser <= state.tolerance) {
                        matchCount++;
                        // 一致するピクセルを青色でマーク
                        resultData.data[i] = 0;
                        resultData.data[i + 1] = 0;
                        resultData.data[i + 2] = 255;
                        resultData.data[i + 3] = 255;
                    } else {
                        // 一致しないピクセルを赤色でマーク
                        resultData.data[i] = 255;
                        resultData.data[i + 1] = 0;
                        resultData.data[i + 2] = 0;
                        resultData.data[i + 3] = 255;
                    }
                }
            }
        }

        resultCtx.putImageData(resultData, 0, 0);

        // 結果の更新
        const similarity = (matchCount / userDrawnPixelCount) * 100;
        updateResults(similarity, modelColorCount, userDrawnPixelCount, matchCount);
    }

    // 結果表示の更新
    function updateResults(similarity, modelCount, userCount, matchCount) {
        document.getElementById('similarity-score').textContent = similarity.toFixed(2);
        document.getElementById('model-count').textContent = modelCount;
        document.getElementById('user-count').textContent = userCount;
        document.getElementById('match-count').textContent = matchCount;
    }

    // カラープレビューの更新
    function updateColorPreviews() {
        const modelPreview = document.getElementById('model-color-preview');
        const userPreview = document.getElementById('user-color-preview');

        modelPreview.style.backgroundColor = `rgb(${state.modelColor.r}, ${state.modelColor.g}, ${state.modelColor.b})`;
        userPreview.style.backgroundColor = `rgb(${state.userColor.r}, ${state.userColor.g}, ${state.userColor.b})`;
    }

    // RGB値からHEX値への変換
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    // HEX値からRGB値への変換
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // モデルカラーのスライダー更新
    ['R', 'G', 'B'].forEach(channel => {
        const slider = document.getElementById(`model${channel}`);
        const value = document.getElementById(`model${channel}-value`);
        
        slider.addEventListener('input', (e) => {
            state.modelColor[channel.toLowerCase()] = parseInt(e.target.value);
            value.textContent = e.target.value;
            document.getElementById('model-color-picker').value = rgbToHex(
                state.modelColor.r,
                state.modelColor.g,
                state.modelColor.b
            );
            updateColorPreviews();
            updateCanvases();
        });
    });

    // ユーザーカラーのスライダー更新
    ['R', 'G', 'B'].forEach(channel => {
        const slider = document.getElementById(`user${channel}`);
        const value = document.getElementById(`user${channel}-value`);
        
        slider.addEventListener('input', (e) => {
            state.userColor[channel.toLowerCase()] = parseInt(e.target.value);
            value.textContent = e.target.value;
            document.getElementById('user-color-picker').value = rgbToHex(
                state.userColor.r,
                state.userColor.g,
                state.userColor.b
            );
            updateColorPreviews();
            updateCanvases();
        });
    });

    // カラーピッカーのイベントリスナー
    document.getElementById('model-color-picker').addEventListener('input', (e) => {
        const rgb = hexToRgb(e.target.value);
        state.modelColor = rgb;
        
        // スライダーと値の更新
        ['R', 'G', 'B'].forEach(channel => {
            document.getElementById(`model${channel}`).value = rgb[channel.toLowerCase()];
            document.getElementById(`model${channel}-value`).textContent = rgb[channel.toLowerCase()];
        });
        
        updateColorPreviews();
        updateCanvases();
    });

    document.getElementById('user-color-picker').addEventListener('input', (e) => {
        const rgb = hexToRgb(e.target.value);
        state.userColor = rgb;
        
        // スライダーと値の更新
        ['R', 'G', 'B'].forEach(channel => {
            document.getElementById(`user${channel}`).value = rgb[channel.toLowerCase()];
            document.getElementById(`user${channel}-value`).textContent = rgb[channel.toLowerCase()];
        });
        
        updateColorPreviews();
        updateCanvases();
    });

    // 許容範囲の更新
    const toleranceSlider = document.getElementById('tolerance');
    const toleranceValue = document.getElementById('tolerance-value');
    
    toleranceSlider.addEventListener('input', (e) => {
        state.tolerance = parseInt(e.target.value);
        toleranceValue.textContent = e.target.value;
        calculateSimilarity();
    });

    // 初期化
    initializeCanvases();
    updateColorPreviews();
});