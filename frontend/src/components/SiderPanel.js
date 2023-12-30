import {
    LoginOutlined,
    OrderedListOutlined,
    ShopOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from "antd";
import { Link } from "react-router-dom";
import Products from "./Products";
import Orders from "./Orders";
import Seller from "./Seller";
import UserSignUp from "./UserSignUp";
import { useState } from "react";

function SiderPanel({address,isValidUser,sgd,myr,checkValidSeller,isValidSeller,getBalance}) {
    const { Sider } = Layout;

    const ItemContent = ({ title,getBalance }) => {
        let contentComponent;

        switch (title) {
            case 'Products':
                contentComponent = <Products isValidUser={isValidUser} sgd={sgd} myr={myr} getBalance={getBalance}/>;
                break;
            case 'Orders':
                contentComponent = <Orders address={address}/>;
                break;
            case 'Seller':
                contentComponent = <Seller address={address} checkValidSeller={checkValidSeller} isValidSeller={isValidSeller} />;
                break;
            case 'Sign Up':
                contentComponent = <UserSignUp address={address} isValidUser={isValidUser}/>;
                break;
            default:
                contentComponent = <Products isValidUser={isValidUser} sgd={sgd} myr={myr}  getBalance={getBalance}/>;
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

    return (
        <>
            <Layout style={{ minHeight: '100vh'}}>
                <Sider width={"14vw"} theme='light'>
                    <Menu mode="vertical" theme="light" defaultSelectedKeys={['1']}>
                        {items.map((item) => (
                            <Menu.Item key={item.key} icon={item.icon} onClick={() => handleMenuItemClick(item.title)}>
                                <Link>{item.title}</Link>
                            </Menu.Item>
                        ))}
                    </Menu>
                </Sider>
                <ItemContent title={title} getBalance={getBalance}/>
            </Layout>
        </>
    );
}

export default SiderPanel;