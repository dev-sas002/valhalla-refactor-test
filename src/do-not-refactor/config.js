// Port of the legacy API. Overridable so the stack can be run beside other
// services without editing a file that the brief puts off limits; the default
// is the 8888 the exercise ships with.
module.exports = {
  port: Number(process.env.API_PORT) || 8888
}
