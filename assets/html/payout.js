const { emailTemplate } = require("./emailTemplates");

const withdrawalRequest = (userName) =>
  emailTemplate(`  <table
                cellspacing="0"
                cellpadding="0"
                align="center"
                style="
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                "
              >
                <tbody>
                  <tr>
                    <td align="center" style="padding: 0; margin: 0">
                      <table
                        cellspacing="0"
                        cellpadding="0"
                        bgcolor="#ffffff"
                        align="center"
                        style="
                          border-collapse: collapse;
                          border-spacing: 0px;
                          background-color: #ffffff;
                          width: 600px;
                        "
                      >
                        <tbody>
                          <tr>
                            <td
                              align="left"
                              style="
                                padding: 0;
                                margin: 0;
                                padding-top: 20px;
                                padding-left: 20px;
                                padding-right: 20px;
                              "
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                style="
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tbody>
                                  <tr>
                                    <td
                                      align="center"
                                      valign="top"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        width: 560px;
                                      "
                                    >
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                        role="presentation"
                                        style="
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tbody>
                                          <tr>
                                            <td
                                              align="center"
                                              style="padding: 0; margin: 0"
                                            >
                                              <h2
                                                style="
                                                  margin: 0;
                                                  line-height: 26px;
                                                  font-family: roboto,
                                                    'helvetica neue', helvetica,
                                                    arial, sans-serif;
                                                  font-size: 22px;
                                                  font-style: normal;
                                                  font-weight: 500;
                                                  color: #000000;
                                                "
                                              >
                                                <strong
                                                  ><font
                                                    style="
                                                      vertical-align: inherit;
                                                    "
                                                    ><font
                                                      style="
                                                        vertical-align: inherit;
                                                      "
                                                      > Hi Admin,</font
                                                    ></font
                                                  ></strong
                                                >
                                              </h2>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td
                                              align="left"
                                              style="
                                                padding: 0;
                                                margin: 0;
                                                padding-top: 15px;
                                              "
                                            >
                                              <p
                                                style="
                                                  margin: 0;
                                                  font-family: arial,
                                                    'helvetica neue', helvetica,
                                                    sans-serif;
                                                  line-height: 24px;
                                                  color: #333333;
                                                  font-size: 16px;
                                                "
                                              >This is to inform you that a new payout request has been submitted by ${userName}. Please review and process the request as soon as possible.</tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
     </table>`);
const withdrawalApprove = (userName) =>
  emailTemplate(`<table
                        cellspacing="0"
                        cellpadding="0"
                        bgcolor="#ffffff"
                        align="center"
                        style="
                          border-collapse: collapse;
                          border-spacing: 0px;
                          background-color: #ffffff;
                          width: 600px;
                        "
                      >
                        <tbody>
                          <tr>
                            <td
                              align="left"
                              style="
                                padding: 0;
                                margin: 0;
                                padding-top: 20px;
                                padding-left: 20px;
                                padding-right: 20px;
                              "
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                style="
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tbody>
                                  <tr>
                                    <td
                                      align="center"
                                      valign="top"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        width: 560px;
                                      "
                                    >
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                        role="presentation"
                                        style="
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tbody>
                                          <tr>
                                            <td
                                              align="center"
                                              style="padding: 0; margin: 0"
                                            >
                                              <h2
                                                style="
                                                  margin: 0;
                                                  line-height: 26px;
                                                  font-family: roboto,
                                                    'helvetica neue', helvetica,
                                                    arial, sans-serif;
                                                  font-size: 22px;
                                                  font-style: normal;
                                                  font-weight: 500;
                                                  color: #000000;
                                                "
                                              >
                                                <strong>Hi ${userName}</strong>
                                              </h2>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td
                                              align="center"
                                              style="
                                                padding: 0;
                                                margin: 0;
                                                padding-top: 15px;
                                              "
                                            >
                                              <h3
                                                style="
                                                  margin: 0;
                                                  line-height: 32px;
                                                  font-family: roboto,
                                                    'helvetica neue', helvetica,
                                                    arial, sans-serif;
                                                  font-size: 30px;
                                                  font-style: normal;
                                                  font-weight: 500;
                                                  color: #000000;
                                                "
                                              >
                                                <strong
                                                  >Payout Approved</strong
                                                >
                                              </h3>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td
                                              align="left"
                                              style="
                                                padding: 0;
                                                margin: 0;
                                                padding-top: 15px;
                                              "
                                            >
                                              <p
                                                style="
                                                  margin: 0;
                                                  font-family: arial,
                                                    'helvetica neue', helvetica,
                                                    sans-serif;
                                                  line-height: 24px;
                                                  color: #333333;
                                                  font-size: 16px;
                                                "
                                              >
                                              We are pleased to inform you that your payout request has been approved. The funds will be processed and transferred to your designated account shortly.
                                              </p>
                                              <p></p>
                                              <p
                                                style="
                                                  margin: 0;
                                                  font-family: arial,
                                                    'helvetica neue', helvetica,
                                                    sans-serif;
                                                  line-height: 24px;
                                                  color: #333333;
                                                  font-size: 16px;
                                                "
                                              >
                                              Thank you for trading with Real Trade Capital. We look forward to your continued success!
                                              </p>
                                              <p></p>
                                              <p
                                                style="
                                                  margin: 0;
                                                  font-family: arial,
                                                    'helvetica neue', helvetica,
                                                    sans-serif;
                                                  line-height: 24px;
                                                  color: #333333;
                                                  font-size: 16px;
                                                "
                                              >
                                              If you have any questions or need further assistance, please don't hesitate to contact our support team.
                                              </p>
                                              <p></p>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                        role="presentation"
                                        style="
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tbody>
                                          <tr></tr>
                                          <tr>
                                            <td
                                              align="center"
                                              style="
                                                margin: 0;
                                                padding-top: 10px;
                                                padding-bottom: 10px;
                                                padding-right: 10px;
                                                padding-left: 35px;
                                              "
                                            >
                                              <span
                                                style="
                                                  border-style: solid;
                                                  border-color: #1c64f2;
                                                  background: #1c64f2;
                                                  border-width: 0px;
                                                  display: inline-block;
                                                  border-radius: 30px;
                                                  width: auto;
                                                "
                                              >
                                                <a
                                                  href="${process.env.API_URL}/dashboard/payouts"
                                                  style="
                                                    text-decoration: none;
                                                    color: #ffffff;
                                                    font-size: 14px;
                                                    border-style: solid;
                                                    border-color: #000000;
                                                    border-width: 12px 20px;
                                                    display: inline-block;
                                                    background: #000000;
                                                    border-radius: 10px;
                                                    font-family: arial,
                                                      'helvetica neue',
                                                      helvetica, sans-serif;
                                                    font-weight: bold;
                                                    font-style: normal;
                                                    line-height: 17px;
                                                    width: auto;
                                                    text-align: center;
                                                  "
                                                  target="_blank"
                                                >
                                                  Payouts
                                                </a>
                                              </span>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>`);
const withdrawalReject = (userName) =>
  emailTemplate(`  <table
                        cellspacing="0"
                        cellpadding="0"
                        bgcolor="#ffffff"
                        align="center"
                        style="
                          border-collapse: collapse;
                          border-spacing: 0px;
                          background-color: #ffffff;
                          width: 600px;
                        "
                      >
                        <tbody>
                          <tr>
                            <td
                              align="left"
                              style="
                                padding: 0;
                                margin: 0;
                                padding-top: 20px;
                                padding-left: 20px;
                                padding-right: 20px;
                              "
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                style="
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tbody>
                                  <tr>
                                    <td
                                      align="center"
                                      valign="top"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        width: 560px;
                                      "
                                    >
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                        role="presentation"
                                        style="
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tbody>
                                          <tr>
                                            <td
                                              align="center"
                                              style="padding: 0; margin: 0"
                                            >
                                              <h2
                                                style="
                                                  margin: 0;
                                                  line-height: 26px;
                                                  font-family: roboto,
                                                    'helvetica neue', helvetica,
                                                    arial, sans-serif;
                                                  font-size: 22px;
                                                  font-style: normal;
                                                  font-weight: 500;
                                                  color: #000000;
                                                "
                                              >
                                                <strong>Hi ${userName}</strong>
                                              </h2>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td
                                              align="center"
                                              style="
                                                padding: 0;
                                                margin: 0;
                                                padding-top: 15px;
                                              "
                                            >
                                              <h3
                                                style="
                                                  margin: 0;
                                                  line-height: 32px;
                                                  font-family: roboto,
                                                    'helvetica neue', helvetica,
                                                    arial, sans-serif;
                                                  font-size: 30px;
                                                  font-style: normal;
                                                  font-weight: 500;
                                                  color: #000000;
                                                "
                                              >
                                                <strong
                                                  >Payout Request Update</strong
                                                >
                                              </h3>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td
                                              align="left"
                                              style="
                                                padding: 0;
                                                margin: 0;
                                                padding-top: 15px;
                                              "
                                            >
                                              <p
                                                style="
                                                  margin: 0;
                                                  font-family: arial,
                                                    'helvetica neue', helvetica,
                                                    sans-serif;
                                                  line-height: 24px;
                                                  color: #333333;
                                                  font-size: 16px;
                                                "
                                              >
                                              We regret to inform you that your recent payout request has been rejected.
                                              </p>
                                              <p></p>
                                              <p
                                                style="
                                                  margin: 0;
                                                  font-family: arial,
                                                    'helvetica neue', helvetica,
                                                    sans-serif;
                                                  line-height: 24px;
                                                  color: #333333;
                                                  font-size: 16px;
                                                "
                                              >
                                              More details regarding this decision can be found in your Payout section. Please review the information provided or contact our support team if you need further assistance.
                                              </p>
                                              <p></p>
                                              <p
                                                style="
                                                  margin: 0;
                                                  font-family: arial,
                                                    'helvetica neue', helvetica,
                                                    sans-serif;
                                                  line-height: 24px;
                                                  color: #333333;
                                                  font-size: 16px;
                                                "
                                              >
                                              Thank you for your understanding, and we appreciate your continued partnership with Real Trade Capital.
                                              </p>
                                              <p></p>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                        role="presentation"
                                        style="
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tbody>
                                          <tr></tr>
                                          <tr>
                                            <td
                                              align="center"
                                              style="
                                                margin: 0;
                                                padding-top: 10px;
                                                padding-bottom: 10px;
                                                padding-right: 10px;
                                                padding-left: 35px;
                                              "
                                            >
                                              <span
                                                style="
                                                  border-style: solid;
                                                  border-color: #1c64f2;
                                                  background: #1c64f2;
                                                  border-width: 0px;
                                                  display: inline-block;
                                                  border-radius: 30px;
                                                  width: auto;
                                                "
                                              >
                                                <a
                                                 href="${process.env.API_URL}/dashboard/payouts"
                                                  style="
                                                    text-decoration: none;
                                                    color: #ffffff;
                                                    font-size: 14px;
                                                    border-style: solid;
                                                    border-color: #000000;
                                                    border-width: 12px 20px;
                                                    display: inline-block;
                                                    background: #000000;
                                                    border-radius: 10px;
                                                    font-family: arial,
                                                      'helvetica neue',
                                                      helvetica, sans-serif;
                                                    font-weight: bold;
                                                    font-style: normal;
                                                    line-height: 17px;
                                                    width: auto;
                                                    text-align: center;
                                                  "
                                                  target="_blank"
                                                >
                                                  Payouts
                                                </a>
                                              </span>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
`);
module.exports = {
  withdrawalRequest,
  withdrawalApprove,
  withdrawalReject,
};
