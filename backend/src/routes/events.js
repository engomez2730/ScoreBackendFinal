import express from "express";
import * as eventController from "../controllers/eventController.js";

const router = express.Router();

router.get("/", eventController.getEvents);
router.get("/:id", eventController.getEvent);
router.post("/", eventController.createEvent);
router.put("/:id", eventController.updateEvent);
router.delete("/:id", eventController.deleteEvent);

export default router;
