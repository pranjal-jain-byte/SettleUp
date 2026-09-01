import Settlement from "../models/settlement.model.js";
import Group from "../models/group.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Razorpay from "razorpay";
import crypto from "crypto";
export const createSettlement = asyncHandler(async (req, res) => {
  const { groupId, toUserId, amount, note } = req.body;

  if (!groupId || !toUserId || !amount) {
    throw new ApiError(400, "Group ID, toUserId, and amount are required");
  }

  if (amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const group = await Group.findById(groupId).lean();
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const fromUserId = req.user._id.toString();

  const isFromMember = group.members.some((m) => m.user.toString() === fromUserId);
  const isToMember = group.members.some((m) => m.user.toString() === toUserId);

  if (!isFromMember || !isToMember) {
    throw new ApiError(400, "Both users must be members of the group");
  }

  const newSettlement = await Settlement.create({
    group: groupId,
    from: fromUserId,
    to: toUserId,
    amount,
    note: note || "",
    createdBy: req.user._id,
  });

  const populatedSettlement = await Settlement.findById(newSettlement._id)
    .populate("from", "username avatar")
    .populate("to", "username avatar")
    .lean();

  res.status(201).json(populatedSettlement);
});

export const getSettlementsByGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.query;

  if (!groupId) {
    throw new ApiError(400, "Group ID is required");
  }

  const [group, settlements] = await Promise.all([
    Group.findById(groupId).lean(),
    Settlement.find({ group: groupId })
      .populate("from", "username avatar")
      .populate("to", "username avatar")
      .sort({ settledAt: -1 })
      .lean()
  ]);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isMember = group.members.some(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (!isMember) {
    throw new ApiError(403, "You are not a member of this group");
  }

  res.json(settlements);
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  // Amount in paise
  const options = {
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  if (!order) {
    throw new ApiError(500, "Failed to create Razorpay order");
  }

  res.status(201).json({
    order,
    key_id: process.env.RAZORPAY_KEY_ID
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    groupId,
    toUserId,
    amount,
    note,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Payment details are missing");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    throw new ApiError(400, "Invalid payment signature");
  }

  // Payment is authentic, proceed with creating settlement
  if (!groupId || !toUserId || !amount) {
    throw new ApiError(400, "Group ID, toUserId, and amount are required");
  }

  if (amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const group = await Group.findById(groupId).lean();
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const fromUserId = req.user._id.toString();

  const isFromMember = group.members.some((m) => m.user.toString() === fromUserId);
  const isToMember = group.members.some((m) => m.user.toString() === toUserId);

  if (!isFromMember || !isToMember) {
    throw new ApiError(400, "Both users must be members of the group");
  }

  const newSettlement = await Settlement.create({
    group: groupId,
    from: fromUserId,
    to: toUserId,
    amount,
    note: note || "",
    createdBy: req.user._id,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  const populatedSettlement = await Settlement.findById(newSettlement._id)
    .populate("from", "username avatar")
    .populate("to", "username avatar")
    .lean();

  res.status(201).json(populatedSettlement);
});
