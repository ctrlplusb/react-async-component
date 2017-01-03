module.exports = function html(templateParams) {
  const { name, description } = templateParams.htmlWebpackPlugin.options.custom;
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="description" content="${description}"/>
        <meta name="charset" content="utf-8"/>
        <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>${name} example</title>
      </head>
      <body>
        <div id='app'></div>
      </body>
    </html>`;
};
