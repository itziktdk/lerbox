const router = require('express').Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { withUser } = req.query;
    let filter;
    if (withUser) {
      filter = { $or: [{ fromId: req.user._id, toId: withUser }, { fromId: withUser, toId: req.user._id }] };
    } else {
      filter = { $or: [{ fromId: req.user._id }, { toId: req.user._id }] };
    }
    const msgs = await Message.find(filter).populate('fromId', 'name role avatar').populate('toId', 'name role avatar').sort('createdAt').limit(100);
    res.json(msgs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { toId, body } = req.body;
    const msg = new Message({ fromId: req.user._id, toId, body });
    await msg.save();
    res.json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/read/:fromId', auth, async (req, res) => {
  try {
    await Message.updateMany({ fromId: req.params.fromId, toId: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/unread', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ toId: req.user._id, read: false });
    res.json({ count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
