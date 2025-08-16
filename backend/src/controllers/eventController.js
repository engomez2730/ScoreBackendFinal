import * as eventService from "../services/eventService.js";

export const getEvents = async (req, res) => {
  const events = await eventService.getAllEvents();
  res.json(events);
};

export const getEvent = async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: "Evento no encontrado" });
  res.json(event);
};

export const createEvent = async (req, res) => {
  const { nombre, fechaInicio, fechaFin } = req.body;
  try {
    const event = await eventService.createEvent({
      nombre,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  const { nombre, fechaInicio, fechaFin } = req.body;
  try {
    const event = await eventService.updateEvent(req.params.id, {
      nombre,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
    });
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    await eventService.deleteEvent(req.params.id);
    res.json({ message: "Evento eliminado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
