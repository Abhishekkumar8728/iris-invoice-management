import User from "../models/user.model.js";

const createUser = async (
  payload
) => {
  const existingUser =
    await User.findOne({
      $or: [
        {
          employeeId:
            payload.employeeId.toUpperCase()
        },
        {
          email:
            payload.email.toLowerCase()
        }
      ]
    });

  if (existingUser) {
    throw new Error(
      "User with employee ID or email already exists"
    );
  }

  const user =
    await User.create({
      ...payload,

      employeeId:
        payload.employeeId.toUpperCase(),

      email:
        payload.email.toLowerCase()
    });

  return user;
};

const getUsers = async ({
  page = 1,
  limit = 10,
  search,
  role,
  department,
  status
}) => {
  const pageNumber =
    Math.max(Number(page), 1);

  const limitNumber =
    Math.min(
      Math.max(Number(limit), 1),
      100
    );

  const filter = {};

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i"
        }
      },
      {
        email: {
          $regex: search,
          $options: "i"
        }
      },
      {
        employeeId: {
          $regex: search,
          $options: "i"
        }
      }
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (department) {
    filter.department = {
      $regex: department,
      $options: "i"
    };
  }

  if (status !== undefined) {
    filter.isActive =
      status === "active";
  }

  const skip =
    (pageNumber - 1) *
    limitNumber;

  const [
    users,
    total
  ] = await Promise.all([
    User.find(filter)
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    User.countDocuments(filter)
  ]);

  return {
    users,

    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages:
        Math.ceil(
          total / limitNumber
        )
    }
  };
};

const getUserById = async (
  userId
) => {
  const user =
    await User.findById(userId);

  if (!user) {
    throw new Error(
      "User not found"
    );
  }

  return user;
};

const getUserByEmployeeId = async (
  employeeId
) => {
  const user = await User.findOne({
    employeeId: employeeId.toUpperCase()
  });

  if (!user) {
    throw new Error(
      "User profile not found"
    );
  }

  return user;
};

const updateUser = async (
  userId,
  payload
) => {
  if (payload.email) {
    payload.email =
      payload.email.toLowerCase();
  }

  const user =
    await User.findByIdAndUpdate(
      userId,
      payload,
      {
  returnDocument: "after",
  runValidators: true
}
    );

  if (!user) {
    throw new Error(
      "User not found"
    );
  }

  return user;
};

const updateUserStatus =
  async (
    userId,
    isActive
  ) => {
    const user =
      await User.findByIdAndUpdate(
        userId,
        {
          isActive
        },
        {
          new: true
        }
      );

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    return user;
  };
  export const deleteInternalUser = async (employeeId) => {
  const user = await User.findOneAndDelete({
    employeeId,
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const deleteUser = async (
  userId
) => {
  const user =
    await User.findByIdAndDelete(
      userId
    );

  if (!user) {
    throw new Error(
      "User not found"
    );
  }

  return user;
};

export {
  createUser,
  getUsers,
  getUserById,
  getUserByEmployeeId,
  updateUser,
  updateUserStatus,
  deleteUser
};