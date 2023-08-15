const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const filterObj = (obj, ...allowedFields) => {
//   const newObj = {};
//   Object.keys(obj).forEach((el) => {
//     if (allowedFields.includes(el)) {
//       newObj[el] = obj[el];
//     }
//   });
//   return newObj;
// };

exports.getMe = (req, res, next) => {
  const user = {
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  };

  res.status(200).json({
    status: 'success',
    user,
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This rout is not for password updates. Please use /update-my-password instead.',
        400,
      ),
    );
  }

  // // 2) Filtered out unwanted fields names that are not allowed to be updated
  // const filteredBody = filterObj(req.body, 'name', 'email');

  // // 3) Update user document
  // // keep only name and email and filter out all the rest in req.body
  // const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
  //   new: true,
  //   runValidators: true,
  // });
  // // save로 하면 passwordConfirm을 요구하므로 update로

  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     updatedUser,
  //   },
  // });

  const { name, email, photo } = req.body;

  const user = Object.assign(
    req.user,
    JSON.parse(JSON.stringify({ name, email, photo })),
  );

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do NOT update password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
