// Member functionality removed per request. Stubs return 410 Gone.

const gone = (req, res) => res.status(410).json({ message: "Members are not supported" });

module.exports = {
  getMembers: gone,
  addMember: gone,
  updateMember: gone,
  deleteMember: gone,
};
