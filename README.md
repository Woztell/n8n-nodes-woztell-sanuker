# n8n-nodes-woztell-sanuker

Welcome to our Woztell n8n nodes, for easier [Woztell](https://woztell.com/) integration within your n8n workflows, please read:

* [About Us](#about-us)
* [Installation](#installation)
* [Credentials](#credentials)
* [Triggers and Nodes](#triggers-and-nodes)
* [Contact](#contact)
* [Resources](#resources)

## About Us

**Sanuker**

Sanuker is a leading AI Business Messaging Consulting firm, offering professional business messaging services and AI chatbot solutions tailored for enterprises. We distinguish ourselves in the market through our innovative approach to messaging designs and strategies, especially across Meta platforms - WhatsApp, Messenger, Instagram.

As a trusted partners of AWS, HSBC Business Go, and Meta, we serve 10K+ clients across 25 countries through our WOZTELL Conversational Platform, empowering businesses to qualify leads and boost conversions.

**WOZTELL**

WOZTELL is your all-in-one platform to seamlessly create, manage, and deploy chatbots across WhatsApp, Messenger, Instagram, and Websites. Powered by cutting-edge GenAI engines, WOZTELL empowers you to execute personalized broadcasts, manage unlimited live chat agents, and integrate effortlessly with any third-party software via our robust OpenAPI.

You can now create a WOZTELL account and open up a WhatsApp Business API account, completely for free.

**How register a WOZTELL account and WhatsApp Business API for free**

1.  Go to the registration link: https://platform.woztell.com/signup?lang=en&utm_campaign=plugin-n8n&utm_medium=plugin-n8n&utm_source=N8N

2.  Select “Free plan” or “Start for FREE” on the top right of the webpage.

    ![register](https://store.sanuker.cn/nn/images/register.png)

3.  Fill in personal and company details and verify your email.

    ![register2](https://store.sanuker.cn/nn/images/register2.png)

    ![register3](https://store.sanuker.cn/nn/images/register3.png)

4.  Once you signed up, you will be directed to the platform homepage. There, you can register a WhatsApp Business API account for free following [https://doc.woztell.com/docs/procedures/basic-whatsapp-chatbot-setup/standard-procedures-wa-connect-waba/](https://doc.woztell.com/docs/procedures/basic-whatsapp-chatbot-setup/standard-procedures-wa-connect-waba/) or  use the buttons on the top right of the homepage to chat with our sales team or book a demo session.

    ![register4](https://store.sanuker.cn/nn/images/register4.png)



## Installation

Install the community node package in your n8n instance from  [https://docs.n8n.io/integrations/community-nodes/installation/gui-install/](https://docs.n8n.io/integrations/community-nodes/installation/gui-install/)

```
@woztell-sanuker/n8n-nodes-woztell-sanuker
```

![image-20250826180723230](https://store.sanuker.cn/nn/images/image-20250826180723230.png)



## Credentials

Before you begin using our n8n plugin, you will need to obtain your API Credential information from the Woztell Platform. These credentials serve as the essential authentication keys for accessing the Woztell Product API. Please refer to the documentation linked below to acquire the appropriate credential according to the required permission level, and then enter this information into the Woztell n8n Credential configuration.

1. Login your Woztell account at [https://platform.woztell.com/login?lang=en&rp=%2Fwelcome](https://platform.woztell.com/login?lang=en&rp=%2Fwelcome)
2. Open the [https://platform.woztell.com/settings/accesstokens?lang=en](https://platform.woztell.com/settings/accesstokens?lang=en) and enable the `channel:list`, `botapi:sendResponses`, and `bot:redirectMemberToNode` permissions.
3. For more functions you need, please check the document [https://doc.woztell.com/docs/documentations/settings/access-token/](https://doc.woztell.com/docs/documentations/settings/access-token/)
4. Generate the access token.

For more details, please refer to this [link](https://doc.woztell.com/docs/documentations/settings/access-token).

![alt text](https://store.sanuker.cn/nn/images/accessToken.png)
![alt text](https://store.sanuker.cn/nn/images/credential.png)



## Triggers and Nodes

#### Webhook: On Woztell Message received

Through the **Woztell Trigger** node, you can receive webhook messages from any Woztell Channel, including various types such as *Inbound*, *Outbound*, and *Member Update*. Each message is delivered in JSON format and contains comprehensive data along with the associated event information.

Within this node, you can specify the corresponding **Webhook Path** and configure filtering options based on **Channel ID** and **Event Type**, ensuring that the information you receive is properly filtered and can be utilized effectively.

Learn more from: [https://doc.woztell.com/docs/documentations/channels/channels-webhook](https://doc.woztell.com/docs/documentations/channels/channels-webhook)

![image-20250826184406024](https://store.sanuker.cn/nn/images/image-20250826184406024.png)



#### Node: Send Response

Using the **Send Response** node, you can directly send messages from your WhatsApp Business number to the target customer’s WhatsApp account via the Woztell BotAPI. All message content can be placed directly within the Response data.

Once the message is sent, you will receive the corresponding API result, which allows subsequent nodes to continue processing the data.

For more details, please refer to the official Woztell product documentation: [https://doc.woztell.com/docs/reference/bot-api-reference#send-responses](https://doc.woztell.com/docs/reference/bot-api-reference#send-responses)

![sendResponse](https://store.sanuker.cn/nn/images/sendResponse.png)



#### Node: Redirect member to node

With the **Redirect Member to Node** node, you no longer need to manually construct complex JSON data for sending messages. Instead, you simply pass the relevant Woztell information to a **Chatbot Tree** node, and the Woztell Chatbot will handle the subsequent actions for you — such as sending WhatsApp conversation message templates.

This node can be understood as a memory pointer: it redirects the current operation to the Woztell Chatbot. You do not need to prepare complicated data structures; you only need to initiate a request to the BotAPI.

For customers who already have chatbot designs running on the Woztell platform, this provides an excellent way to integrate with n8n.

Learn more from: [https://doc.woztell.com/docs/reference/bot-api-reference#redirect-member-to-node](https://doc.woztell.com/docs/reference/bot-api-reference#redirect-member-to-node)

![redirectMemberToNode](https://store.sanuker.cn/nn/images/redirectMemberToNode.png)

#### Send WhatsApp Template message

According to WhatsApp’s official business messaging guidelines, when contacting unfamiliar WhatsApp numbers or numbers outside the 24-hour session window, you must first send a **WhatsApp Template Message**.

Our n8n plugin significantly simplifies the complexity of working with WhatsApp Template Messages. The current node can automatically generate the required message content based on templates that have already been created and approved. You only need to complete the corresponding form fields, and the Template Message can be sent directly.

Learn more from: [https://doc.woztell.com/docs/integrations/whatsapp/wa-message-types#whatsapp-message-template](https://doc.woztell.com/docs/integrations/whatsapp/wa-message-types#whatsapp-message-template)

![image-20250826185818626](https://store.sanuker.cn/nn/images/image-20250826185818626.png)

## Contact

We sincerely appreciate your strong support and understanding of our current n8n plugin. If you are interested in learning more about our products or services, you may also reach us through the following channels:

*  Woztell product team: [https://woztell.com](https://woztell.com)
*  Sanuker service team: [https://sanuker.com](https://sanuker.com)
*  Email: [kris@woztell.com](mailto:kris@woztell.com)
*  Email: [hello@woztell.com](mailto:hello@woztell.com)
*  WOZTELL Customer Success WhatsApp: [https://wa.me/14157959796](https://wa.me/14157959796)
*  Sanuker Service WhatsApp: [https://wa.me/85254432330](https://wa.me/85254432330)

## Resources

- n8n Community Nodes, [https://docs.n8n.io/integrations/#community-nodes](https://docs.n8n.io/integrations/#community-nodes)
- Woztell Platform documentation, [https://doc.woztell.com/](https://doc.woztell.com/)
- Woztell Bot API, [https://doc.woztell.com/docs/reference/bot-api-reference](https://doc.woztell.com/docs/reference/bot-api-reference)
- Woztell Open API, [https://doc.woztell.com/open-api-reference](https://doc.woztell.com/open-api-reference)
- Woztell Webhook, [https://doc.woztell.com/docs/documentations/channels/channels-webhook](https://doc.woztell.com/docs/documentations/channels/channels-webhook)
- WhatsApp Integration on Woztell: [https://doc.woztell.com/docs/integrations/whatsapp/wa-overview](https://doc.woztell.com/docs/integrations/whatsapp/wa-overview)
- Facebook Messenger Integration on Woztell: [https://doc.woztell.com/docs/integrations/facebook/fb-overview](https://doc.woztell.com/docs/integrations/facebook/fb-overview)
- Instagram Integration on Woztell: [https://doc.woztell.com/docs/integrations/instagram/ig-overview](https://doc.woztell.com/docs/integrations/instagram/ig-overview)
- Webchat Integration on Woztell: [https://doc.woztell.com/docs/integrations/web-chat/webchat-overview](https://doc.woztell.com/docs/integrations/web-chat/webchat-overview)