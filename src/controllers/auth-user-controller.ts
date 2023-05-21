import { Request, Response, NextFunction } from "express";
const User = require("../models/user-model");
const catchAsync = require("../../utils/catch-async");
const AppError = require('../../utils/custom-error');


exports.signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const user = await User.create(req.body);
    const token = user.createJWT();
    res.status(201).json({
      msg: `the user ${user.userName} was created`, 
      success:'signUp',
      token, });

  })

exports.logIn = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {userName, email,password} = req.body

      if (!userName || !email ||!password) {
        throw new AppError({message:'Please provide email and password',statusCode: 404})
      }
      
      const user = await User.findOne({email});

      const isPasswordCorrect = await user.comparePassword(password)
      if (!isPasswordCorrect) {
        console.log('the password is wrong');
        throw new AppError({message:'Wrong Password', statusCode: 404})}

      const token = user.createJWT();

      res.status(200).json({
        msg: `the user ${user.userName} has logged in`, 
        success:'signUp',
        token, });
  
  });
