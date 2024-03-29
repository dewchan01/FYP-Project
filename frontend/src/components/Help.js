import React from 'react';
import ReactPlayer from 'react-player';
import { Typography, Collapse, Button, List, Avatar } from 'antd';

const { Paragraph } = Typography;
const { Panel } = Collapse;

function Help() {
    const data = [
        {
            title: 'Account 1: Campaign Organizer / Seller / MCBDC Contract Owner',
            address: '0x785Bbaf36c85fB92707aa318F513aD6e0C443862'
        },
        {
            title: 'Account 2: DSGD Token Contract Owner',
            address: '0x87F93ac2B7Bb1bd6707cd726cdb652940721ffB0'
        },
        {
            title: 'Account 3: DMYR Token Contract Owner',
            address: '0x3FCb02ECb3550Cb868e116aDDE2fe5771eC10e80'
        },
        {
            title: 'Account 5: E-Commerce Platform User',
            address: '0x1f0Bac3BF8F38a01a2D53838F477789B6aeEf472'
        },
        {
            title: 'Account 6: E-Commerce Platform Owner / Voucher Contract Owner',
            address: '0xaB1D979D8Fa2cC475FD03e87A316dFDb35E5d911'
        },

    ];
    return (
        <div style={{ margin: "20px 0 0 10px", width: "98%", minHeight: "88vh" }}>
            <Paragraph>
                Welcome to the Help section. Here you can find information and assistance on various topics.
            </Paragraph>
            <List
                itemLayout="horizontal"
                dataSource={data}
                renderItem={(item, index) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`} />}
                            title={<a target="blank" href={`https://sepolia.etherscan.io/address/${item.address}`}>{item.title}</a>}
                            description={item.address}
                        />
                    </List.Item>
                )}
            />
            <Collapse accordion>
                <Panel header="How to Get Started for Cross-border Transaction ?" key="1">
                    <ReactPlayer width="20%" height="20%" controls="true" url="https://youtu.be/-D72El9FEYw"/>
                    <Paragraph>
                        To get started, create contract and set up the environment for cross-border transaction:
                        <ol>
                            <li>Account 1: Deploy MCBDC Contract</li>
                            <li>Account 2: Deploy DSGD Contract</li>
                            <li>Account 3: Deploy DMYR Contract</li>
                            <li>Account 1: Add new tokens SGD and MYR to mCBDC</li>
                            <li>Account 2: Set mCBDC as allowed contract in DSGD</li>
                            <li>Account 3: Set mCBDC as allowed contract in DMYR</li>
                            <li>Account 2 / Account 3: Mint DSGD or DMYR to Campaign Organizer and Platform User for creating voucher and purchasing product</li>
                            <li>Account 1: Top up the balance of LINK token for mCBDC to at least 0.1 LINK for requesting Foreign Exchange Rate</li>
                            <li>Platform User: Request Fx Rate (SGD, MYR)</li>
                            <li>Platform User: Swap Token by Sender within 3 minutes after the request</li>
                            <li>Platform User: Check history in mCBDC</li>
                        </ol>
                    </Paragraph>
                </Panel>
                <Panel header="How to Get Started for Requesting Payment and Pay by Another Currency ?" key="2">
                <ReactPlayer width="20%" height="20%" controls="true" url="https://youtu.be/n0-mmq9vaBA"/>
                    <Paragraph>
                        Assume that the enviroment for cross-border transaction is set up:
                        <ol>
                            <li>Recipient: Create request</li>
                            <li>Sender: Get request</li>
                            <li>Sender: Apply fromCurrency and targetCurrency to get the Fx rate, which lasts for 3 minutes</li>
                            <li>Sender: Pay the request by providing params (fromCurrency, 0), where 0 is the index of the requests received</li>
                            <li>Sender: Get the request again to double-check the payment</li>
                            <li>Sender & Recipient: Check history whether if the payment is made successfully</li>
                        </ol>
                    </Paragraph>
                </Panel>
                <Panel header="How to Get Started for Selling Product and Creating Voucher ?" key="3">
                <ReactPlayer width="20%" height="20%" controls="true" style={{display: "inline-block"}} url="https://youtu.be/lvz4gB6DE0c"/>
                <ReactPlayer width="20%" height="20%" controls="true" style={{display: "inline-block", marginLeft: "10px"}} url="https://youtu.be/eUzGpOjnW4U"/>
                    <Paragraph>
                        Assume that the enviroment for cross-border transaction is set up:
                        <ol>
                            <li>Account 6: Deploy Voucher Contract</li>
                            <li>Account 6: Deploy E-Commerce Contract</li>
                            <li>Seller: Sign up as a seller</li>
                            <li>Seller: Add Product to platform to sell product</li>
                            <li>Seller: Ensure that your wallet has sufficient balance to create voucher</li>
                            <li>Seller: Create voucher that includes your product Id in suitable product Ids array, thus it can be used</li>
                            <li>Seller: Check the voucher details to ensure the price Currency for product, voucher and paying method is the same</li>
                            <li>Seller: Request CID to compose IPFS during storing of voucher details to NFT Storage</li>
                            <li>Seller: Submit the creation of voucher and autopay the funds to platform owner to manage</li>
                            <li>Seller: Verify the voucher details being uploaded to IPFS to correct by clicking the hyperlink on title of voucher</li>
                            <li>Platform Owner: Increase the allowance for MCBDC Contract to reimburse the discount price to seller</li>
                        </ol>
                    </Paragraph>
                </Panel>
                <Panel header="How to Get Started for Buying Product with Voucher ?" key="4">
                <ReactPlayer style={{display: "inline-block"}} width="20%" height="20%" controls="true" url="https://youtu.be/N6CapDnUXbI"/>
                <ReactPlayer style={{display: "inline-block", marginLeft: "10px"}} width="20%" height="20%" controls="true" url="https://youtu.be/lvz4gB6DE0c"/>
                <ReactPlayer style={{display: "inline-block", marginLeft: "10px"}} width="20%" height="20%" controls="true" url="https://youtu.be/eUzGpOjnW4U"/>
                    <Paragraph>
                        Assume that the enviroment for cross-border transaction, e-commerce platform is set up:
                        <ol>
                            <li>User: Sign up as a user</li>
                            <li>User: Claim only 1 voucher at the voucher tab and check whether the claim word has changed to claimed</li>
                            <li>User: Ensure that your wallet has sufficient balance to buy product with voucher</li>
                            <li>User: Include the voucher Ids that available for buying the product</li>
                            <li>User: Discounted price of fund will be transferred to seller</li>
                            <li>Platform Owner: Reimburse voucher value to seller</li>
                            <li>User: Check your order at the order tab to confirm your order is successful</li>
                        </ol>
                    </Paragraph>
                </Panel>

                <Panel header="Common Issues" key="5">
                    <Paragraph>
                        If you encounter any issues, please check the following:
                        <ul>
                            <li>Issue 1: Laggy, please be patient and wait for the request from contract, don't refresh the window if contract writing is undergoing</li>
                            <li>Issue 2: Buggy, use Effect sometimes would not rerender due to clashing of state of various variable,
                                please check the console for more details and try to click other components for rerendering
                            </li>
                            <li>Issue 3: Inconsistent of coding style due to different learning phases</li>
                        </ul>
                    </Paragraph>
                </Panel>
            </Collapse>
            <Paragraph>
                If you still have questions or need further assistance, feel free to reach out to us via email.&nbsp;
                <Button type="primary" href="mailto:deweichan@gmail.com" style={{ color: 'white' }}>
                    Email Us
                </Button>
            </Paragraph>
        </div>
    );
}

export default Help;
