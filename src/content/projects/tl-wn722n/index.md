---
title: TL WN722N
description: Cậu bé tinh nghịch và Tp WN722N
date: 2026-03-14
categories:
  - Phần cứng
  - Lab
repositoryUrl:
projectUrl: 
status: Done
image: "[[TL-WN722N.png]]"
imageAlt: TL WN722N.
hideCoverImage: false
hideTOC: false
draft: false
featured: true
aliases:

---
## 1. Giới thiệu thiết bị

### 1.1 Tổng quan
TP-Link TL-WN722N là USB Wireless Adapter dùng để kết nối máy tính với mạng Wi-Fi theo chuẩn IEEE 802.11 b/g/n.

### 1.2 Thông số kỹ thuật
- Loại: USB Wireless Adapter  
- Chuẩn Wi-Fi: 802.11 b/g/n  
- Tốc độ tối đa: 150 Mbps (2.4 GHz)  
- Kết nối: USB 2.0  
- Ăng-ten: 4 dBi (rời, RP-SMA)  
- Hệ điều hành:  
  - Windows, Linux, macOS (cũ)

### 1.3 Công dụng
- Kết nối Wi-Fi cho máy tính  
- Tăng khả năng thu sóng  
- Phục vụ lab bảo mật (pentest)  

---

## 2. Các phiên bản phần cứng

| Version | Chipset        | Khả năng Pentest              |
|--------|---------------|------------------------------|
| V1     | Atheros AR9271 | Tốt (monitor + injection)    |
| V2     | Realtek        | Hạn chế                      |
| V3/V4  | Realtek        | Ít dùng                      |

Thiết bị đang dùng: **V2**

---

## 3. Vai trò trong Wireless Security

Thiết bị thường dùng trong:
- Ethical hacking  
- Wireless pentest  
- Phân tích Wi-Fi  

Hỗ trợ:
- Monitor Mode  
- Packet Injection  
- Soft AP  

---

## 4. Kiến thức nền tảng Wi-Fi (IEEE 802.11)

### 4.1 Wi-Fi là gì
- Công nghệ mạng không dây dùng sóng RF (Radio Frequency)  
- Hoạt động theo chuẩn IEEE 802.11  

### 4.2 Kiến trúc mạng Wi-Fi
- AP (Access Point): phát Wi-Fi  
- Client: thiết bị kết nối  
- SSID (Service Set Identifier): tên mạng  
- BSSID: MAC của AP  

### 4.3 Các chuẩn Wi-Fi

| Chuẩn   | Tốc độ        | Băng tần     |
|--------|--------------|-------------|
| 802.11b | 11 Mbps       | 2.4 GHz     |
| 802.11g | 54 Mbps       | 2.4 GHz     |
| 802.11n | 150–600 Mbps  | 2.4/5 GHz   |

### 4.4 Công nghệ chính

- **DSSS (Direct Sequence Spread Spectrum)**:  
  Công nghệ trong chuẩn 802.11b, trải rộng tín hiệu trên dải tần rộng giúp chống nhiễu tốt và ổn định. Tuy nhiên tốc độ thấp, tối đa khoảng 11 Mbps.

- **OFDM (Orthogonal Frequency Division Multiplexing)**:  
  Áp dụng trong 802.11g, chia kênh thành nhiều sóng mang con để truyền song song, giúp tăng tốc độ lên đến 54 Mbps và giảm nhiễu, nhưng phức tạp hơn.

- **MIMO (Multiple Input Multiple Output)**:  
  Dùng trong 802.11n, sử dụng nhiều ăng-ten để truyền nhiều luồng dữ liệu cùng lúc, giúp tăng tốc độ (150–600 Mbps), độ ổn định và phạm vi phủ sóng.

---

## 5. Frame trong Wi-Fi

### 5.1 Các loại frame

- **Management Frame**
  - Thiết lập, duy trì và quản lý kết nối  
  - Bao gồm: phát hiện mạng, xác thực, kết nối  

- **Control Frame**
  - Điều khiển truy cập kênh truyền  
  - Tránh xung đột dữ liệu  

- **Data Frame**
  - Truyền dữ liệu thực tế (web, email, video)  

### 5.2 Một số frame quan trọng

- **Beacon Frame**
  - Do AP phát định kỳ  
  - Chứa SSID, kênh, bảo mật  

- **Probe Request / Probe Response**
  - Probe Request: client gửi  
  - Probe Response: AP trả lời  

- **Authentication Frame**
  - Xác thực giữa client và AP  

- **Association Frame**
  - Thiết lập kết nối chính thức  

- **Data Frame**
  - Truyền dữ liệu thực tế  

---

## 6. Monitor Mode

### 6.1 Khái niệm
Cho phép:
- Nghe toàn bộ traffic Wi-Fi  
- Không cần kết nối mạng  

### 6.2 Các chế độ card Wi-Fi
- Managed Mode  
- Monitor Mode  

### 6.3 Công cụ
- Airmon-ng → bật monitor mode  
- Airodump-ng → scan & capture  

### 6.4 Quy trình
1. Kiểm tra interface  
2. Bật monitor mode  
3. Scan mạng  

---

## 7. Capture WPA/WPA2 Handshake

### 7.1 Khái niệm
- Quá trình xác thực giữa client và AP  
- Sinh khóa mã hóa (PTK, GTK)  

### 7.2 4 bước handshake
1. ANonce  
2. SNonce  
3. GTK  
4. ACK  

### 7.3 Mục đích
- Crack mật khẩu offline  

### 7.4 Quy trình
1. Xác định AP  
2. Capture bằng airodump-ng  
3. Chờ client kết nối  

---

## 8. Deauthentication Attack

### 8.1 Khái niệm
- Gửi frame giả để ngắt kết nối client  

### 8.2 Mục đích
- Bắt handshake  
- Kiểm tra bảo mật  

### 8.3 Công cụ
- Aireplay-ng  

### 8.4 Quy trình
1. Xác định BSSID  
2. Gửi deauth  
3. Client reconnect → capture handshake  

---

## 9. Crack Wi-Fi Password

### 9.1 Dictionary Attack
- Thử mật khẩu từ wordlist  

### 9.2 Công cụ
- Aircrack-ng  

### 9.3 Quy trình
1. Có file handshake (.cap)  
2. Có wordlist  
3. Chạy aircrack-ng  

### 9.4 Nguyên lý
- Tạo hash → so sánh với handshake  

---

## 10. Evil Twin Attack

### 10.1 Khái niệm
- Tạo AP giả giống AP thật  

### 10.2 Mục tiêu
- Đánh cắp:
  - Mật khẩu Wi-Fi  
  - Tài khoản  
  - Dữ liệu  

### 10.3 Công cụ
- Airbase-ng  
- Hostapd  
- Wifiphisher  

### 10.4 Quy trình
1. Clone SSID  
2. Deauth client  
3. Client kết nối AP giả  
4. Hiển thị phishing page  

---

## 11. Tổng kết

Thiết bị **TL-WN722N**:
- Là công cụ phổ biến trong lab Wi-Fi  
- Hỗ trợ:
  - Monitor mode  
  - Packet injection  

Ứng dụng:
- Phân tích mạng  
- Kiểm thử bảo mật  
- Mô phỏng tấn công Wi-Fi  