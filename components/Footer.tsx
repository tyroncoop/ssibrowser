import React from 'react';

function Footer() {
    return (
        <footer id="footer" style={{ marginLeft: '4%' }}>
            <ul className="icons">
                <li>
                    <a
                        className="icon brands fa-discord"
                        href="https://discord.gg/NPbd92HJ7e"
                        rel="noreferrer" target="_blank"
                    >
                        <span className="label">
                            Discord
                        </span>
                    </a>
                </li>
                <li>
                    <a
                        className="icon brands fa-twitter"
                        href="https://twitter.com/ssibrowser"
                        rel="noreferrer" target="_blank"
                    >
                        <span className="label">Twitter</span>
                    </a>
                </li>
                <li>
                    <a
                        className="icon brands fa-github"
                        href="https://github.com/tyroncoop/ssibrowser"
                        rel="noreferrer" target="_blank"
                    >
                        <span className="label">GitHub</span>
                    </a>
                </li>
                <li>
                    <a
                        className="icon brands fa-instagram"
                        href="https://www.instagram.com/ssiprotocol/"
                        rel="noreferrer" target="_blank"
                    >
                        <span className="label">Instagram</span>
                    </a>
                </li>
            </ul>
        </footer>
    );
}

export default Footer;
