import React, { useState, useEffect } from "react";
import SignupOtpVerificationModal from "./SignupOtpVerificationModal";
// import { Form, Button, Message, Dropdown, Checkbox } from "semantic-ui-react";
import {
  Form,
  Input,
  Select,
  Button,
  Tooltip,
  Alert,
  message,
  Row,
  Col,
} from "antd";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import ReCAPTCHA from "react-google-recaptcha";
import axios from "axios";
import "../styles/SignUpModal.css";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CircularProgress from "@mui/material/CircularProgress";
import { FaUser, FaLock, FaEnvelope, FaIdBadge } from "react-icons/fa";
import { EyeInvisibleOutlined, EyeFilled } from "@ant-design/icons";
import "../styles/fonts.css";

const { Option } = Select;

function SignUpModal({ onClose = { handleSignUpClose } }) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  // const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [domainJoinUPN, setDomainJoinUPN] = useState("@kggroup.com");
  const [password, setPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  const [showDomainFields, setShowDomainFields] = useState(false);
  const [domainToJoin, setDomainToJoin] = useState("");
  const [organizationalUnitPath, setOrganizationalUnitPath] = useState("");
  const [email, setEmail] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConstraints, setShowConstraints] = useState(false);
  const [showEmailConstraints, setShowEmailConstraints] = useState(false);

  const isLengthValid = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  const isValidEmailFormat = email.includes("@") && email.includes(".");
  const hasValidDomain = /\.[a-zA-Z]{2,}$/.test(email);
  const isAtPositionValid = email.indexOf("@") > 0;

  const [ouDetails, setOuDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  const [adname, setAdname] = useState("DC01.kggroup.com");
  const [domains, setDomains] = useState([]);

  const [showLoader, setShowLoader] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);

  const [form] = Form.useForm();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [otpSignupData, setOtpSignupData] = useState(null);

  const handleSelectDomain = (value) => {
    setDomainToJoin(value); // Set selected domain name
    domainoptionsname(value); // Call the handler function
  };

  useEffect(() => {
    const fetchOUs = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/auth/ad-OUdetails`
        );
        setOuDetails(
          response.data.organizationalUnits.map((ou) => ({
            key: ou.ou,
            value: ou.distinguishedName,
            text: ou.ou,
          }))
        );
        // setLoading(false);
      } catch (err) {
        console.error("Error fetching OUs:", err);
        setError("Failed to fetch Organizational Units from server.");
        // setLoading(false);
      }
    };

    fetchOUs();

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const checkADUser = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-ad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: `${username}${domainJoinUPN}` }),
      });
      const data = await response.json();
      if (data.exists) {
        return true;
      } else {
        setError("User does not exist in Active Directory");
        return false;
      }
    } catch (error) {
      setError("An error occurred while checking Active Directory.");
      return false;
    }
  };

  const handleSignUp = async (values) => {
    console.log(values);

    // if (password !== confirmPassword) {
    //   setError("Passwords do not match");
    //   return;
    // }

    // if (!isValidEmailFormat || !isAtPositionValid || !hasValidDomain) {
    //   setError("Invalid email format");
    //   return;
    // }

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA");
      return;
    }

    setError("");

    const isInAD = await checkADUser(values?.username);
    if (!isInAD) return;

    try {
      setShowLoader(true);
      setEmail(values?.email);
      setEmployeeNumber(values?.employee_number);
      setPassword(values?.password);
      setUsername(values?.username);
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain_join_upn: `${values?.username}${domainJoinUPN}`,
          password: values.password,
          email: values.email,
          employee_number: values?.employee_number,
          domain_to_join: domainToJoin,
          recaptchaToken,
          specifyDomainOrUnit: showDomainFields ? "Yes" : "No", // Pass "Yes" or "No" based on toggle
        }),
      });

      const data = await response.json();
      if (
        data.message ===
        "User exists in AD. OTP sent to email for verification."
      ) {
        setShowLoader(false);
        setSuccessMessage(
          "Signup successful! Verify the OTP sent to your email."
        );
        setError("");
        setOtpSignupData({
          domain_join_upn: `${values?.username}${domainJoinUPN}`,
          password: values.password,
          email: values.email,
          employee_number: values?.employee_number,
          domain_to_join: domainToJoin,
          recaptchaToken,
          specifyDomainOrUnit: showDomainFields ? "Yes" : "No",
        });
        setShowOtpVerification(true);
        await fetch(`${API_BASE_URL}/auth/send-approval-mail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            username: `${username}${domainJoinUPN}`,
          }),
        });
      } else if (
        data.message === "User with this email is already registered"
      ) {
        setError(
          "An account with this email already exists. Please use a different email."
        );
        setShowLoader(false);
        setSuccessMessage("");
      } else if (
        data.message === "User with this domainJoinUPN is already registered!"
      ) {
        setShowLoader(false);
        setError(
          "An account with this Domain Join UPN already exists. Please use a different domain join UPN."
        );
        setSuccessMessage("");
      } else if (
        data.message === "User with this employee number is already registered!"
      ) {
        setError(
          "An account with this employee number already exists. Please use a different employee number."
        );
        setShowLoader(false);
        setSuccessMessage("");
      } else {
        setError(data.message || "Inavlid Password!");
        setShowLoader(false);
        setSuccessMessage("");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      setSuccessMessage("");
    }
  };

  const onRecaptchaChange = (token) => setRecaptchaToken(token);
  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  // const toggleConfirmPasswordVisibility = () =>
  //   setConfirmPasswordVisible(!confirmPasswordVisible);

  const domainOptions = Array.isArray(domains)
    ? domains.map((domain, index) => {
        // Join 'DC=' components, whether uppercase or lowercase, into a readable format
        const domainText = domain.distinguishedName
          .split(",")
          .filter((part) => part.trim().toUpperCase().startsWith("DC="))
          .map((part) => part.split("=")[1])
          .join(".");

        return {
          key: index,
          value: domain.distinguishedName,
          text: domainText, // Show as readable domain (e.g., "kggroup.com")
        };
      })
    : [{ key: 0, value: domains, text: domains }];

  const fetchDomains = async (adname) => {
    setShowLoader(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/domains/${adname}`);
      setDomains(response.data);
    } catch (err) {
      console.error("Error fetching domains:", err);
      setError("Error fetching domain data");
    } finally {
      setShowLoader(false);
    }
  };

  useEffect(() => {
    fetchDomains(adname);
  }, []);

  const domainoptionsname = (domain) => {
    console.log(domain);
    const domainName = domain
      .split(",")
      .filter((part) => part.trim().toUpperCase().startsWith("DC="))
      .map((part) => part.split("=")[1])
      .join(".");
    setDomainToJoin(domainName);
  };

  // const handleAdnameChange = (e, { value }) => {
  //   setAdname(value);
  // };

  const handleCreateUserInDB = async () => {
    setShowLoader(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain_join_upn: `${username}${domainJoinUPN}`,
          password,
          email,
          employee_number: employeeNumber,
          domain_to_join: domainToJoin,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(
          "User created successfully. Pending for Admin approval."
        );
        setShowOtpVerification(false); // Close OTP modal
        setShowLoader(false);

        message.success("User Created Successfully");
        onClose();
        // onClose();
        form.resetFields();
      } else {
        setError(data.message || "User creation failed.");
        setShowLoader(false);
      }
    } catch (error) {
      setError("An error occurred while creating the user.");
      setShowLoader(false);
      setShowOtpVerification(false);
    }
  };

  const [showUserNameTooltip, setShowUserNameTooltip] = useState(false);

  return (
    <>
      {showLoader && (
        <div className="loader-backdrop">
          <CircularProgress />
        </div>
      )}

      <div className="signup-modal-overlay">
        <div className="signup-modal-container">
          {/* Close Button */}
          <span className="close-icon" onClick={onClose}>
            <FaTimes />
          </span>

          {/* Sign Up Title */}
          <h2 className="signup-modal-title">Sign Up</h2>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSignUp}
            className="signup-form"

          >
            {/* Domain Selection */}


            <Form.Item
              label={
                <span style={{ color: "#2d368e" }}>Select Domain</span>
              }
              name="domain"
              rules={[
                { required: true, message: "Please select a domain!" },
              ]}
            >
              <Select
                placeholder="Select Domain"
                onChange={handleSelectDomain}
                className="custom-select input-underline" // Apply CSS class to style the select field
                popupClassName="custom-dropdown" // Apply CSS class for dropdown menu
              >
                {domainOptions.map((option, index) => (
                  <Select.Option key={index} value={option.value}>
                    {option.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Tooltip
              title="Select a Domin to Enter the username"
              placement="right"
              color="#1a73e8"
              arrow={true}
              visible={showUserNameTooltip}
            >
              {/* Username Field with Icon */}
              <Form.Item
                label={<span style={{ color: "#2d368e" }}>Username</span>}
                name="username"
                rules={[{ required: true }]}
              >
                <div className="username-container">
                  <Input
                    suffix={<FaUser style={{ color: "#2D368E" }} />}
                    placeholder="Enter Username"
                    className="sign-up-input input-underline"
                    disabled={domainToJoin === ""}
                    onMouseOver={() => {
                      if (domainToJoin === "") {
                        setShowUserNameTooltip(true);
                      }
                    }}
                    onMouseLeave={() => {
                      setShowUserNameTooltip(false);
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.15)",
                      color: "#fff",
                    }}
                  />

                  {domainToJoin && (
                    <span className="domain-display">@{domainToJoin}</span>
                  )}
                </div>
              </Form.Item>
            </Tooltip>


            <Form.Item
              label={<span style={{ color: "#2d368e" }}>Password</span>}
              name="password"
              rules={[{ required: true }]}
            >
              {/* <Input.Password
                  placeholder="Password"
                  iconRender={(visible) => (visible ? <EyeTwoTone style={{color:"white"}} /> : <EyeInvisibleOutlined />)}
                  style={{ background: "rgba(255, 255, 255, 0.15)", color: "#fff" }}
                /> */}

              <Input.Password
                prefix={<FaLock style={{ color: "#2D368E" }} />}
                placeholder="Password"
                className="sign-up-input input-underline"
                iconRender={(visible) =>
                  visible ? (
                    <EyeInvisibleOutlined style={{ color: "#555" }} />
                  ) : (
                    <EyeFilled style={{ color: "#555" }} />
                  )
                }
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: "#2d368e" }}>Email ID</span>}
              name="email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input
                suffix={<FaEnvelope style={{ color: "#2D368E" }} />}
                placeholder="Email ID"
                className="sign-up-input input-underline"
                onFocus={() => setShowEmailConstraints(true)}
                onBlur={() => setShowEmailConstraints(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                }}
              />
            </Form.Item>
            {/* 
              {showEmailConstraints && (
                <div className="email-constraints">
                  <p style={{ color: isValidEmailFormat ? "green" : "#fd5c63", fontWeight: "bold" }}>
                    • Contains "@" and "."
                  </p>
                  <p style={{ color: isAtPositionValid ? "green" : "#fd5c63", fontWeight: "bold" }}>
                    • "@" should not be the first character
                  </p>
                  <p style={{ color: hasValidDomain ? "green" : "#fd5c63", fontWeight: "bold" }}>
                    • Ends with a valid domain (e.g., ".com", ".org")
                  </p>
                </div>
              )} */}


            <Form.Item
              label={
                <span style={{ color: "#2d368e" }}>Employee Number</span>
              }
              name="employee_number"
              rules={[{ required: true }]}
              style={{ marginTop: "10px" }}
            >
              <Input
                suffix={<FaIdBadge style={{ color: "#2D368E" }} />}
                placeholder="Employee Number"
                className="sign-up-input input-underline"
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                }}
              />
            </Form.Item>
    

            <Form.Item style={{ marginTop: 15 }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ transform: "scale(0.85)", transformOrigin: "center" }}>
                  <ReCAPTCHA
                    sitekey="6Lf81FwrAAAAAP9-H4I310GdFuBIXBtP4FdWAE7X"
                    onChange={(value) => {
                      onRecaptchaChange(value);
                    }}
                  />
                </div>
              </div>
            </Form.Item>



            {/* reCAPTCHA */}
            <Form.Item>
              <div className="Klean-signup-button-container">
                <Button
                  className="signup-button-register"
                  htmlType="submit"
                  block
                  style={{
                    fontSize: "1.2rem",
                    fontFamily: "proximaNova-regular",
                    letterSpacing: "1.4px",
                    width: "120px",
                  }}
                >
                  Register
                </Button>
              </div>
            </Form.Item>

            {/* Register Button */}

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{
                  background: "#fff",
                  border: "1px solid rgba(255, 0, 0, 0.5)",
                  color: "red",
                  textAlign: "center",
                  fontWeight: "normal",
                }}
              />
            )}
          </Form>

          {showOtpVerification && (
            <SignupOtpVerificationModal
              onClose={() => setShowOtpVerification(false)}
              email={email}
              signupData={{
                username,
                password,
                email,
                employee_number: employeeNumber,
                domain_join_upn: `${username}${domainJoinUPN}`,
                domain_to_join: domainToJoin,
                recaptchaToken,
                specifyDomainOrUnit: showDomainFields ? "Yes" : "No",
              }}
              onOtpSuccess={handleCreateUserInDB} // Call handleCreateUserInDB on successful OTP verification
            />
          )}
        </div>
      </div>
    </>
  );
}

export default SignUpModal;