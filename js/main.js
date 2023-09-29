const video = document.getElementById("video");

const emotionsObj = {
  neutral: "😐😐 Neutral 😑😶",
  happy: "😀😁 Happy 🙂😄",
  angry: "😡🔥 Angry 🔥😡",
  sad: "😔😟 Sad 😔😔",
  surprised: "😮😯 Surprised 😯😮",
  disguested: "🤢🤮 Disguested 🤢🤮",
  fearful: "😨😱 Fearful 😱😨",
};

const genderObj = {
  male: "👨🏼👨🏼‍💻 Male 👨🏼‍💻👨🏼",
  female: "👩🏻🧑🏻‍💻 Female 🧑🏻‍💻👩🏻",
  other: "Others",
};

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(() => startVideo());

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("playing", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.querySelector(".stream").append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    if (resizedDetections && Object.keys(resizedDetections).length > 0) {
      const age = resizedDetections[0].age;
      const interpolatedAge = interpolateAgePredictions(age);
      const gender = resizedDetections[0].gender;
      const expressions = resizedDetections[0].expressions;
      const maxValue = Math.max(...Object.values(expressions));
      const emotion = Object.keys(expressions).filter(
        (item) => expressions[item] === maxValue
      );

      document.querySelector("#age span").innerText = `${Math.round(
        interpolatedAge
      )} years`;
      document.querySelector("#gender span").innerText = `${
        gender === "male" || gender === "female"
          ? genderObj[gender]
          : genderObj.other
      }`;
      document.querySelector("#emotion span").innerText = `${
        emotionsObj[emotion[0]]
      }`;
    }
  }, 100);
});

function interpolateAgePredictions(age) {
  predictedAges = [age].concat(predictedAges).slice(0, 30);

  const avgPredictedAge =
    predictedAges.reduce((total, a) => total + a) / predictedAges.length;

  return avgPredictedAge;
}

let predictedAges = [];
