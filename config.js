var port1 = process.env.PORT || 80
module.exports = {
  app_title: 'Ugandan Art Project',
  database: 'mongodb://eva:E6DQ9Te7u3gh@localhost/ugandan-art',
  https: false, // Used only for the cookie, HTTPS itself should be configured in nginx
  domain: 'localhost',
  secret: 'SUPERSECRETKEY',
  port: port1,
  salt_length: 64,

  enable_restrictions: false, // Enable in-game restricted area/creation
  allow_restriction_intersect: false, // Whether restrictions can intersect each other or not
  allow_custom_colors: true,

  cooldown: 0, // Cooldown between player places in seconds
  cooldown_chat: 0, // Cooldown between chat messages in milliseconds
  connect_cooldown: false, // Apply the default cooldown on connect
  width: 1500,
  height: 1500,
  clear_color: 0xFFFFFFFF,
  palette: ['#FFFFFF', '#DAD45E', '#6DC2CA', '#D2AA99', '#6DAA2C', '#8595A1', '#D27D2C', '#597DCE', '#757161', '#D04648', '#346524', '#854C30', '#4E4A4F', '#30346D', '#442434', '#000000']
};
