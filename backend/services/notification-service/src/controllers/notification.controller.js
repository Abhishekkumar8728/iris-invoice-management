import {successResponse, errorResponse} from "../utils/response.js";
import {createOtp, verifyOtp} from "../services/otp.service.js";
import {sendNotification, getNotificationHistory} from "../services/notification.service.js";
import {sendNotificationSchema, sendOtpSchema, verifyOtpSchema} from "../validators/notification.validator.js";
import Notification from "../models/notification.model.js";

const sendNotificationController =
  async (
    req,
    res,
    next
  ) => {
    try {
      const notification =
        await sendNotification(
          req.body
        );

      return successResponse(
        res,
        notification,
        "Notification sent successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  };

const sendOtpController = async (
  req,
  res,
  next
) => {

  try {

    const {
      error,
      value
    } = sendOtpSchema.validate(
      req.body
    );

    if (error) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        error.details
      );
    }

    const result =
      await createOtp(value);

    return successResponse(
      res,
      result,
      "OTP sent successfully",
      201
    );

  } catch (error) {
    next(error);
  }
};

const verifyOtpController = async (
  req,
  res,
  next
) => {

  try {

    const {
      error,
      value
    } = verifyOtpSchema.validate(
      req.body
    );

    if (error) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        error.details
      );
    }

    const result =
      await verifyOtp(value);

    return successResponse(
      res,
      result,
      "OTP verified successfully"
    );

  } catch (error) {

    return errorResponse(
      res,
      error.message,
      400
    );
  }
};

const notificationHistoryController =
  async (req, res, next) => {

    try {

      const page =
        Math.max(
          Number(req.query.page) || 1,
          1
        );

      const limit =
        Math.min(
          Number(req.query.limit) || 20,
          100
        );

      const result =
        await getNotificationHistory({
          recipient: req.query.recipient,
          page,
          limit
        });

      return successResponse(
        res,
        result,
        "Notification history fetched"
      );

    } catch (error) {
      next(error);
    }
  };



const getNotifications =
  async (req, res, next) => {

    try {

      const userId =
        req.user.sub;

      const page =
        Math.max(
          Number(req.query.page) || 1,
          1
        );

      const limit =
        Math.min(
          Number(req.query.limit) || 20,
          100
        );

      const skip =
        (page - 1) * limit;

      const [
        notifications,
        total,
        unreadCount
      ] =
        await Promise.all([

          Notification
            .find({ userId })
            .sort({
              createdAt: -1
            })
            .skip(skip)
            .limit(limit),

          Notification.countDocuments({
            userId
          }),

          Notification.countDocuments({
            userId,
            isRead: false
          })

        ]);

      res.json({

        success: true,

        message:
          'Notifications fetched successfully.',

        data: {

          notifications,

          unreadCount,

          pagination: {

            page,

            limit,

            total,

            totalPages:
              Math.ceil(
                total / limit
              )

          }

        }

      });

    } catch (error) {

      next(error);

    }

  };

const getPublicUserNotifications =
  async (req, res, next) => {

    try {

      const userId =
        req.user.sub;

      const page =
        Math.max(
          Number(req.query.page) || 1,
          1
        );

      const limit =
        Math.min(
          Number(req.query.limit) || 20,
          100
        );

      const skip =
        (page - 1) * limit;

      const filter = { userId };

      if (req.query.unreadOnly === "true") {
        filter.isRead = false;
      }

      const [
        notifications,
        total
      ] =
        await Promise.all([

          Notification
            .find(filter)
            .sort({
              createdAt: -1
            })
            .skip(skip)
            .limit(limit),

          Notification.countDocuments(filter)

        ]);

      res.json({
        success: true,
        message: "Notifications fetched successfully.",
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {

      next(error);

    }

  };

const markAsRead =
  async (req, res, next) => {

    try {

      const notification =
        await Notification.findOneAndUpdate(

          {
            _id: req.params.id,

            userId:
              req.user.sub
          },

          {
            $set: {
              isRead: true,
              readAt: new Date()
            }
          },

          {
            new: true
          }

        );

      if (!notification) {

        return res.status(404).json({

          success: false,

          message:
            'Notification not found.'

        });

      }

      res.json({

        success: true,

        message:
          'Notification marked as read.',

        data: notification

      });

    } catch (error) {

      next(error);

    }

  };

const markAllAsRead =
  async (req, res, next) => {

    try {

      await Notification.updateMany(

        {
          userId:
            req.user.sub,

          isRead: false
        },

        {
          $set: {
            isRead: true,
            readAt: new Date()
          }
        }

      );

      res.json({

        success: true,

        message:
          'All notifications marked as read.'

      });

    } catch (error) {

      next(error);

    }

  };

export {
  sendNotificationController,
  sendOtpController,
  verifyOtpController,
  notificationHistoryController,


  getNotifications as userNotificationHistoryController,
  getPublicUserNotifications as publicUserNotificationHistoryController,
  markAsRead as markNotificationReadController,
  markAllAsRead as markAllNotificationsReadController
};