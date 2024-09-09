const footer = require("./footer");

const emailTemplate = (body) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div style="background-color: #ffffff">
      <table
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="
          border-collapse: collapse;
          border-spacing: 0px;
          padding: 0;
          margin: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
          background-position: center top;
          background-color: #ffffff;
        "
      >
        <tbody>
          <tr>
            <td valign="top" style="padding: 0; margin: 0">  
            ${header()}  
            ${body}      
            ${footer()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>

  </html>
`;

// Exporting everything from one file
module.exports = {
  emailTemplate,
};
