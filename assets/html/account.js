const { emailTemplate } = require("./emailTemplates");

const toNext = (account) =>
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
                                              >
                                              This is to notify you that a new request (${account}) has been submitted for a phase upgrade in a challenge. Please review and process the request to move the user to the next step or phase of their trading journey.                                            </td>
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
                    </td>
                  </tr>
                </tbody>
              </table>`);
const accountPhaseTwo = (account, userName) =>
  emailTemplate(`
      <img
            src="https://res.cloudinary.com/dj5inosqh/image/upload/v1725905218/IMG_1435_z6t7ua.png"
            alt="Header"
            style="
              display: block;
              border: 0;
              outline: none;
              text-decoration: none;
              padding-top: 5px;
                  margin-left: auto;
    margin-right: auto;
            "
            width="600"

            class="CToWUd a6T"
            data-bit="iit"
            tabindex="0"
          />
          <div
            class="a6S"
            dir="ltr"
            style="
              opacity: 0.01;
              left: 820px;
              top: 771.038px;
            "
          >
            <span
              data-is-tooltip-wrapper="true"
              class="a5q"
              jsaction="JIbuQc:.CLIENT"
              ><button
                class="VYBDae-JX-I VYBDae-JX-I-ql-ay5-ays CgzRE"
                jscontroller="PIVayb"
                jsaction="click:h5M12e; clickmod:h5M12e;pointerdown:FEiYhc;pointerup:mF5Elf;pointerenter:EX0mI;pointerleave:vpvbp;pointercancel:xyn4sd;contextmenu:xexox;focus:h06R8; blur:zjh6rb;mlnRJb:fLiPzd;"
                data-idom-class="CgzRE"
                jsname="hRZeKc"
                aria-label="Download attachment "
                data-tooltip-enabled="true"
                data-tooltip-id="tt-c14"
                data-tooltip-classes="AZPksf"
                id=""
                jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTgwOTcxMjQyMjEzNjI0NDk4MiJd; 43:WyJpbWFnZS9qcGVnIl0."
              >
                <span
                  class="OiePBf-zPjgPe VYBDae-JX-UHGRz"
                ></span
                ><span
                  class="bHC-Q"
                  data-unbounded="false"
                  jscontroller="LBaJxb"
                  jsname="m9ZlFb"
                  soy-skip=""
                  ssk="6:RWVI5c"
                ></span
                ><span
                  class="VYBDae-JX-ank-Rtc0Jf"
                  jsname="S5tZuc"
                  aria-hidden="true"
                  ><span
                    class="bzc-ank"
                    aria-hidden="true"
                    ><svg
                      viewBox="0 -960 960 960"
                      height="20"
                      width="20"
                      focusable="false"
                      class="aoH"
                    >
                      <path
                        d="M480-336L288-528l51-51L444-474V-816h72v342L621-579l51,51L480-336ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72H696v-72h72v72q0,29.7-21.16,50.85T695.96-192H263.72Z"
                      ></path></svg></span
                ></span>
                <div
                  class="VYBDae-JX-ano"
                ></div>
              </button>
              <div
                class="ne2Ple-oshW8e-J9"
                id="tt-c14"
                role="tooltip"
                aria-hidden="true"
              >
                Download
              </div></span
            >
          </div>
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
                              margin-left: auto;
    margin-right: auto;
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
                                                  >Passed to Second Phase</strong
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
                                              Congratulations on passing (${account}) to the second phase of your challenge! We are pleased to inform you that your trading phase has now advanced to the next level.
                                              
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
                                              Best of luck with your continued trading journey.
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
                                                Please review our trading rules and objectives to ensure you remain in compliance and avoid any unintentional violations.
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
                                                  href="${process.env.API_URL}/dashboard"
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
                                                  Dashboard
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
const accountFunded = (account, userName) =>
  emailTemplate(`       
 <img
    src="https://res.cloudinary.com/dj5inosqh/image/upload/v1725905208/IMG_1437_qyunb5.png"
    alt="Header"
    style="
      display: block;
      border: 0;
      outline: none;
      text-decoration: none;
      padding-top: 5px;
          margin-left: auto;
    margin-right: auto;
    "
    width="600"
    
    class="CToWUd a6T"
    data-bit="iit"
    tabindex="0"
  />
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
                              margin-left: auto;
    margin-right: auto;
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
                                                  >Passed to Funded Stage</strong
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
                                              Congratulations on passing (${account}) to the funded stage of your challenge! We are pleased to inform you that your trading journey has now advanced to the next level.
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
                                              Best of luck with your continued trading journey.
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
                                                Please review our trading rules and objectives to ensure you remain in compliance and avoid any unintentional violations.
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
                                                  href="${process.env.API_URL}/dashboard"
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
                                                  Dashboard
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
const accountFailed = (account, userName) =>
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
                                                      >Hi ${userName}</font
                                                    ></font
                                                  ></strong
                                                >
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
                                                  >Trading Rule Breach
                                                  Detected</strong
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
                                              We regret to inform you that your account, ${account}, has violated one of our program's regulations.
                                              </p>
                                            </td>
                                          </tr>
                                    
                                          <tr>
                                            <td
                                              align="left"
                                              style="
                                                padding: 0;
                                                margin: 0;
                                                padding-top: 35px;
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
                                              Please visit your dashboard to review your alerts and get more details on the violation.
                                              </p>
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
                                               href="${process.env.API_URL}/dashboard"
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
                                                  Dashboard
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
                    </td>
                  </tr>
                </tbody>
              </table>
`);
module.exports = {
  toNext,
  accountPhaseTwo,
  accountFunded,
  accountFailed,
};
