import React from "react";
import { Link } from "react-router-dom";

const Developer = () => {
  return (
    <>

          <h1>
            Designed & <span>Developed by</span>
          </h1>


      {/* Centered Card */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 20px 40px" }}>
        <section className="glass panel" style={{ width: "100%", maxWidth: "420px" }}>
          {/* Profile */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                width: "130px",
                height: "130px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid rgba(167, 139, 250, 0.45)",
                margin: "0 auto 18px",
              }}
            >
              <img
                src="/assets/pic.JPG"
                alt="AK"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: "24px" }}>AK</h2>
            <p style={{ margin: 0, opacity: 0.85, fontSize: "14px" }}>
              Full Stack Developer
            </p>
          </div>

          {/* Contact Info */}
          <div className="info-list" style={{ gridTemplateColumns: "1fr" }}>
            <div className="info-item">
              <span>Phone</span>
              <strong>
                <a href="tel:8737832724" style={{ color: "inherit", textDecoration: "none" }}>
                  8737832724
                </a>
              </strong>
            </div>
            <div className="info-item">
              <span>Email</span>
              <strong>
                <a
                  href="mailto:abhishek4712ak1@gmail.com"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  abhishek4712ak1@gmail.com
                </a>
              </strong>
            </div>
            <div className="info-item">
              <span>LinkedIn</span>
              <strong>
                <a
                  href="https://www.linkedin.com/in/abhishek4712ak"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  abhishek4712ak
                </a>
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div className="actions" style={{ marginTop: "28px", justifyContent: "center" }}>

            <a href="mailto:abhishek4712ak1@gmail.com" className="btn btn-ghost">
              Send Email
            </a>
          </div>
        </section>
      </div>

      <footer className="site-footer">
        Shri Ram Murti Smarak College of Engineering & Technology, Bareilly
        <br />
        © 2026 ZEST 2K26
      </footer>
    </>
  );
};

export default Developer;