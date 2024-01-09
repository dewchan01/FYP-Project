import {
    LoginOutlined,
    OrderedListOutlined,
    ShopOutlined,
    TagOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from "antd";
import { Link } from "react-router-dom";
import Products from "./Products";
import Orders from "./Orders";
import Seller from "./Seller";
import UserSignUp from "./UserSignUp";
import Voucher from "./Voucher";
import { useState } from "react";

function SiderPanel({ address, isValidUser, sgd, myr, checkValidSeller, isValidSeller, getBalance, balanceOfVouchers, expiredVouchers, getBalanceOfVoucher, getExpiredVoucher }) {
    const { Sider } = Layout;

    const ItemContent = ({ title, getBalance }) => {
        let contentComponent;

        switch (title) {
            case 'Products':
                contentComponent = <Products isValidUser={isValidUser} sgd={sgd} myr={myr} getBalance={getBalance} address={address}
                    balanceOfVouchers={balanceOfVouchers} expiredVouchers={expiredVouchers}
                    getBalanceOfVoucher={getBalanceOfVoucher} getExpiredVoucher={getExpiredVoucher} />;
                break;
            case 'Orders':
                contentComponent = <Orders address={address} />;
                break;
            case 'Seller':
                contentComponent = <Seller address={address} checkValidSeller={checkValidSeller} isValidSeller={isValidSeller} />;
                break;
            case 'Sign Up':
                contentComponent = <UserSignUp address={address} isValidUser={isValidUser} />;
                break;
            case 'Voucher':
                contentComponent = <Voucher address={address} isValidUser={isValidUser} sgd={sgd} myr={myr}
                    getBalance={getBalance} expiredVouchers={expiredVouchers} getExpiredVoucher={getExpiredVoucher} />;
                break;
            default:
                contentComponent = <Products isValidUser={isValidUser} sgd={sgd} myr={myr} getBalance={getBalance}
                    address={address} balanceOfVouchers={balanceOfVouchers}
                    expiredVouchers={expiredVouchers} getBalanceOfVoucher={getBalanceOfVoucher}
                    getExpiredVoucher={getExpiredVoucher} />;
        }
        return <div>{contentComponent}</div>;

    }
    const items = [
        getItem('Products', '1', <ShopOutlined />),
        // getItem('Orders', '2', <MenuOutlined />, [
        //     getItem('Order Details', '3', <OrderedListOutlined />, '/order-details'),
        // ]),
        getItem('Orders', '2', <OrderedListOutlined />),
        getItem('Seller', '3', <TeamOutlined />),
        getItem('Voucher', '5', <TagOutlined />),
        getItem('Sign Up', '4', <LoginOutlined />),
    ];

    // Define the getItem function
    function getItem(title, key, icon) {
        return {
            title,
            key,
            icon,
        };
    }
    // const [collapsed, setCollapsed] = useState(false);
    const [title, setTitle] = useState('');
    const handleMenuItemClick = (title) => {
        setTitle(title);
    };
    const [isSiderCollapsed, setIsSiderCollapsed] = useState(false);
    return (
        <>
            <Layout style={{ minHeight: '90vh' }}>
                <Sider width={"15vw"} theme='light' collapsible collapsed={isSiderCollapsed}
                    onCollapse={() => setIsSiderCollapsed(!isSiderCollapsed)}
                    style={{
                        position: 'fixed',  
                        left: 0,             
                        height: '100%',      
                        overflow: 'auto',  
                    }}>
                    <Menu mode="vertical" theme="light" defaultSelectedKeys={['1']}>
                        {items.map((item) => (
                            <Menu.Item key={item.key} icon={item.icon} onClick={() => handleMenuItemClick(item.title)}>
                                <Link>{item.title}</Link>
                            </Menu.Item>
                        ))}
                    </Menu>
                </Sider>
                <div style={{ marginLeft: isSiderCollapsed ? '8vw' : '15vw', transition: 'margin-left 0.2s' }}>
                    {/* Add some padding to the right based on the Sider width */}
                    <ItemContent title={title} getBalance={getBalance} />
                </div>
            </Layout>
        </>
    );
}

export default SiderPanel;