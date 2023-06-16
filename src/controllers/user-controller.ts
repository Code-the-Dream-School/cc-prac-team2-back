import { Request, Response, NextFunction } from "express";
const multiparty = require("multiparty");
const User = require("../models/user-model");
const Conversation = require("../models/conversation-model");
const catchAsync = require("../../utils/catch-async");
const AppError = require("../../utils/custom-error");
const cloudinary = require("../../utils/cloudinary");

exports.getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: any = req.user;
    const currentUser = await User.findOne({ _id: userId });

    const contactedUsers = await User.find({
      _id: { $ne: currentUser._id },
      conversations: { $in: currentUser.conversations },
    }).select("_id userName conversations profileImage");

    contactedUsers.forEach((user: any) => {
      user.conversations = user.conversations.filter((conversationId: any) =>
        currentUser.conversations.includes(conversationId)
      );
    });

    const modifiedUsers = contactedUsers.map((user: any) => {
      return {
        _id: user._id,
        userName: user.userName,
        profileImage: user.profileImage,
        conversation: user.conversations[0].toString(),
        conversations: undefined,
      };
    });

    const uncontactedUsers = await User.find({
      _id: { $ne: currentUser._id },
      conversations: { $nin: currentUser.conversations },
    }).select("_id userName profileImage");

    if (contactedUsers.length < 1 && uncontactedUsers.length < 1) {
      res
        .status(200)
        .json({ status: "Success", message: "There are currently no users" });
    }

    res.status(200).json({
      status: "Success",
      users: { contactedUsers: modifiedUsers, uncontactedUsers },
    });
  }
);

exports.getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const user = await User.findOne({ _id: userId });

    if (!user) {
      throw new AppError("This user does not exist", 404);
    }

    res.status(200).json({ status: "Success", user });
  }
);

exports.getUserConversations = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const populateOptions = [
      { path: "users", select: "userName _id profileImage" },
    ];

    const conversations = await Conversation.find({ users: userId }).populate(
      populateOptions
    );

    if (conversations.length < 1) {
      res
        .status(200)
        .json({ status: "Success", message: "This user has no conversations" });
    }

    res.status(200).json({ status: "Success", conversations });
  }
);

exports.getUserConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;

    const populateOptions = [
      { path: "users", select: "userName" },
      { path: "messages", select: "message sender createdAt" },
    ];

    const conversation = await Conversation.findOne({
      _id: conversationId,
    }).populate(populateOptions);

    if (!conversation) {
      throw new AppError("This conversation does not exist", 404);
    }

    res.status(200).json({ status: "Success", conversation });
  }
);

exports.updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const form = new multiparty.Form();

    form.parse(req, async function (err: any, fields: any, files: any) {
      let result: any;

      if (files.image) {
        if (
          files.image[0].originalFilename.substr(-4, 4) == ".png" ||
          files.image[0].originalFilename.substr(-4, 4) == ".jpg" ||
          files.image[0].originalFilename.substr(-4, 4) == "jpeg"
        ) {
          result = await cloudinary.uploader.upload(files.image[0].path, {
            folder: "profile",
          });
        } else {
          return next(
            new AppError(
              "the only image format accepted are .jpg, .png and .jpeg",
              422
            )
          );
        }
      }

      const { userName, public_id } = fields;

      if (public_id) cloudinary.uploader.destroy(public_id);

      let updateObj: any = {
        profileImage: { public_id: result?.public_id, url: result?.url },
      };

      if (!updateObj.profileImage.public_id) updateObj = {};

      if (userName) updateObj.userName = userName[0];

      const user = await User.findOneAndUpdate({ _id: userId }, updateObj, {
        new: true,
      });
      if (!user) {
        return next(new AppError("No user found with the provided Id", 404));
      }

      res.status(200).json({
        success: "true",
        user,
      });
    });
  }
);
