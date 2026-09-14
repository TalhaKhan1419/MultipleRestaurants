function success(res, data, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function failure(res, message = "Request failed", status = 400, errors) {
  return res.status(status).json({ success: false, message, ...(errors && { errors }) });
}

module.exports = { success, failure };
