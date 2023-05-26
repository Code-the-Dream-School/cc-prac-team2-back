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
      const {email,password} = req.body

      if (!email ||!password) {
        return next (new AppError('Please provide email and password', 404));
      }
      
      const user = await User.findOne({email});
      if (!user) {
        throw next( new AppError('A user with this email address could not be found. Please double check the spelling of this user', 404))}


      const isPasswordCorrect = await user.comparePassword(password)
      if (!isPasswordCorrect) {

        throw next( new AppError('User was identified, but this looks like the wrong password. Please double check your password', 404))}

      const token = user.createJWT();

      res.status(200).json({
        msg: `the user ${user.userName} has logged in`, 
        success:'logIn',
        token, });
  
  });
