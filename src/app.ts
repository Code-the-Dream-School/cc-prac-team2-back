// types of the req, res and next...
import { Request, Response, NextFunction } from "express";
//
const express = require("express");
const app = express();
const cors = require("cors");
const favicon = require("express-favicon");
const logger = require("morgan");
const session = require("express-session");
const passport = require("../utils/passport-config");
const mainRouter = require("./routes/mainRouter");
const messageRouter = require("./routes/message-router");
const accountRouter = require("./routes/account-router");
// const authRouter = require("./routes/auth-router");
const userRouter = require("./routes/user-router");
const { globalErrorHandler } = require("./../src/controllers/error-controller");
const bufferToUint8Array = require("buffer-to-uint8array");

// middleware


app.use((_:any, res: Response, next: NextFunction) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});


app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(logger("dev"));
app.use(express.static("public"));
app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(passport.initialize());
app.use(passport.session());

// routes
app.get(
  "/api/v1/test",
  async (req: Request, res: Response, next: NextFunction) => {
    const axios = require("axios");
    const cloudinary = require("cloudinary").v2;
    const dotenv = require("dotenv");
    const bufferToStream = require("buffer-to-stream");
    dotenv.config({ path: "./config.env" });

    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });
 

    const encodedParams = new URLSearchParams();
    encodedParams.set(
      "src",
      "my name is abdulazeez and i am a student of bayero university"
    );
    encodedParams.set("hl", "en-us");
    encodedParams.set("r", "0");
    encodedParams.set("c", "mp3");
    encodedParams.set("f", "8khz_8bit_mono");
    encodedParams.set("b64", "true");

    const options = {
      method: "POST",
      url: "https://voicerss-text-to-speech.p.rapidapi.com/",
      params: {
        key: "01537add834e4932a9494a9ef7cdd290",
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "X-RapidAPI-Key": "33a8952a40msh04e26314bd4ef39p1548cejsn2f05c0e1d8c5",
        "X-RapidAPI-Host": "voicerss-text-to-speech.p.rapidapi.com",
      },
      data: encodedParams,
    };
    const response = await axios.request(options);
    console.log(response);
    
    const audioData = response.data;
    const audioBuffer = Buffer.from(audioData);
    const audioStream = bufferToStream(audioBuffer);

    const chunks: any = [];
    audioStream.on("data", (chunk: any) => {
      chunks.push(chunk);
    });

    audioStream.on("end", () => {
      const buffer = Buffer.concat(chunks);

      res.status(200).json({
        audioData: audioData,
        size: buffer.length,
        type: "audio/mp3",
      });

    });
  }
);




// app.use("/api/v1/auth", authRouter);

app.use("/api/v1/account", accountRouter);

app.use(
  "/api/v1/users",
  passport.authenticate(["jwt"], { session: true }),
  userRouter
);

app.use(
  "/api/v1/",
  passport.authenticate(["jwt"], { session: true }),
  mainRouter
);

app.use(
  "/api/v1/",
  passport.authenticate(["jwt"], { session: true }),
  messageRouter
);

// handle requests that do not exist on our server
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({
    status: "not found",
    message: `can't find ${req.url} on this server`,
  });
});
app.use(globalErrorHandler);





export {};
module.exports = app;
