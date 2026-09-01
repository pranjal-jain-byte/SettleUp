import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createSettlement,
  getSettlementsByGroup,
  createRazorpayOrder,
  verifyRazorpayPayment
} from "../controllers/settlement.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createSettlement);
router.get("/", getSettlementsByGroup);
router.post("/razorpay-order", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);

export default router;
