import type { Vocab } from '@/lib/types'

/** More words to learn after the starter decks, unlocked 20 at a time (HSK 1–2 Chinese, A1–A2 Spanish). */
type W = Pick<Vocab, 'term' | 'reading' | 'hanviet' | 'pos' | 'meaning_en' | 'meaning_vi' | 'example' | 'example_reading' | 'example_en' | 'example_vi'>
const zh = (term: string, reading: string, hanviet: string, pos: string, meaning_en: string, meaning_vi: string, example: string, example_reading: string, example_en: string, example_vi: string): W =>
  ({ term, reading, hanviet, pos, meaning_en, meaning_vi, example, example_reading, example_en, example_vi })
const es = (term: string, reading: string, pos: string, meaning_en: string, meaning_vi: string, example: string, example_en: string, example_vi: string): W =>
  ({ term, reading, hanviet: null, pos, meaning_en, meaning_vi, example, example_reading: null, example_en, example_vi })

export const ZH_BANK: W[] = [
  zh('名字', 'míngzi', 'Danh tự', 'noun', 'name', 'tên', '你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'What is your name?', 'Bạn tên là gì?'),
  zh('什么', 'shénme', 'Thập ma', 'pronoun', 'what', 'cái gì', '这是什么？', 'Zhè shì shénme?', 'What is this?', 'Đây là cái gì?'),
  zh('哪儿', 'nǎr', 'Na nhi', 'pronoun', 'where', 'ở đâu', '你去哪儿？', 'Nǐ qù nǎr?', 'Where are you going?', 'Bạn đi đâu?'),
  zh('怎么', 'zěnme', 'Chẩm ma', 'pronoun', 'how', 'thế nào', '这个字怎么读？', 'Zhège zì zěnme dú?', 'How do you read this character?', 'Chữ này đọc thế nào?'),
  zh('为什么', 'wèishénme', 'Vị thập ma', 'adverb', 'why', 'tại sao', '你为什么学习中文？', 'Nǐ wèishénme xuéxí Zhōngwén?', 'Why do you study Chinese?', 'Tại sao bạn học tiếng Trung?'),
  zh('现在', 'xiànzài', 'Hiện tại', 'noun', 'now', 'bây giờ', '现在几点？', 'Xiànzài jǐ diǎn?', 'What time is it now?', 'Bây giờ là mấy giờ?'),
  zh('昨天', 'zuótiān', 'Tạc thiên', 'noun', 'yesterday', 'hôm qua', '昨天我很忙。', 'Zuótiān wǒ hěn máng.', 'I was very busy yesterday.', 'Hôm qua tôi rất bận.'),
  zh('早上', 'zǎoshang', 'Tảo thượng', 'noun', 'morning', 'buổi sáng', '我早上七点起床。', 'Wǒ zǎoshang qī diǎn qǐchuáng.', 'I get up at seven in the morning.', 'Tôi dậy lúc bảy giờ sáng.'),
  zh('晚上', 'wǎnshang', 'Vãn thượng', 'noun', 'evening', 'buổi tối', '晚上我看书。', 'Wǎnshang wǒ kàn shū.', 'I read in the evening.', 'Buổi tối tôi đọc sách.'),
  zh('星期', 'xīngqī', 'Tinh kỳ', 'noun', 'week', 'tuần', '一个星期有七天。', 'Yí gè xīngqī yǒu qī tiān.', 'A week has seven days.', 'Một tuần có bảy ngày.'),
  zh('学校', 'xuéxiào', 'Học hiệu', 'noun', 'school', 'trường học', '我们的学校很大。', 'Wǒmen de xuéxiào hěn dà.', 'Our school is very big.', 'Trường của chúng tôi rất lớn.'),
  zh('大学', 'dàxué', 'Đại học', 'noun', 'university', 'đại học', '她在大学学习经济。', 'Tā zài dàxué xuéxí jīngjì.', 'She studies economics at university.', 'Cô ấy học kinh tế ở đại học.'),
  zh('考试', 'kǎoshì', 'Khảo thí', 'noun', 'exam', 'kỳ thi', '明天有考试。', 'Míngtiān yǒu kǎoshì.', 'There is an exam tomorrow.', 'Ngày mai có bài thi.'),
  zh('问题', 'wèntí', 'Vấn đề', 'noun', 'question, problem', 'câu hỏi, vấn đề', '我有一个问题。', 'Wǒ yǒu yí gè wèntí.', 'I have a question.', 'Tôi có một câu hỏi.'),
  zh('作业', 'zuòyè', 'Tác nghiệp', 'noun', 'homework', 'bài tập về nhà', '我先做作业。', 'Wǒ xiān zuò zuòyè.', 'I will do my homework first.', 'Tôi làm bài tập trước.'),
  zh('图书馆', 'túshūguǎn', 'Đồ thư quán', 'noun', 'library', 'thư viện', '我们在图书馆见。', 'Wǒmen zài túshūguǎn jiàn.', "Let's meet at the library.", 'Chúng ta gặp nhau ở thư viện.'),
  zh('手机', 'shǒujī', 'Thủ cơ', 'noun', 'mobile phone', 'điện thoại di động', '我的手机没电了。', 'Wǒ de shǒujī méi diàn le.', 'My phone is out of battery.', 'Điện thoại của tôi hết pin rồi.'),
  zh('买', 'mǎi', 'Mãi', 'verb', 'to buy', 'mua', '我想买一本书。', 'Wǒ xiǎng mǎi yì běn shū.', 'I want to buy a book.', 'Tôi muốn mua một cuốn sách.'),
  zh('商店', 'shāngdiàn', 'Thương điếm', 'noun', 'shop', 'cửa hàng', '商店九点开门。', 'Shāngdiàn jiǔ diǎn kāimén.', 'The shop opens at nine.', 'Cửa hàng mở cửa lúc chín giờ.'),
  zh('米饭', 'mǐfàn', 'Mễ phạn', 'noun', 'cooked rice', 'cơm', '我每天吃米饭。', 'Wǒ měitiān chī mǐfàn.', 'I eat rice every day.', 'Tôi ăn cơm mỗi ngày.'),
  zh('茶', 'chá', 'Trà', 'noun', 'tea', 'trà', '你喝茶吗？', 'Nǐ hē chá ma?', 'Do you drink tea?', 'Bạn uống trà không?'),
  zh('咖啡', 'kāfēi', 'Ca phê', 'noun', 'coffee', 'cà phê', '早上我喝一杯咖啡。', 'Zǎoshang wǒ hē yì bēi kāfēi.', 'I drink a cup of coffee in the morning.', 'Buổi sáng tôi uống một cốc cà phê.'),
  zh('水果', 'shuǐguǒ', 'Thủy quả', 'noun', 'fruit', 'trái cây', '多吃水果对身体好。', 'Duō chī shuǐguǒ duì shēntǐ hǎo.', 'Eating more fruit is good for your health.', 'Ăn nhiều trái cây tốt cho sức khỏe.'),
  zh('好吃', 'hǎochī', 'Hảo cật', 'adjective', 'delicious', 'ngon', '这个菜很好吃。', 'Zhège cài hěn hǎochī.', 'This dish is delicious.', 'Món này rất ngon.'),
  zh('去', 'qù', 'Khứ', 'verb', 'to go', 'đi', '我们去公园吧。', 'Wǒmen qù gōngyuán ba.', "Let's go to the park.", 'Chúng ta đi công viên nhé.'),
  zh('来', 'lái', 'Lai', 'verb', 'to come', 'đến', '你什么时候来？', 'Nǐ shénme shíhou lái?', 'When are you coming?', 'Khi nào bạn đến?'),
  zh('回家', 'huí jiā', 'Hồi gia', 'verb', 'to go home', 'về nhà', '我六点回家。', 'Wǒ liù diǎn huí jiā.', 'I go home at six.', 'Tôi về nhà lúc sáu giờ.'),
  zh('坐', 'zuò', 'Tọa', 'verb', 'to sit; to take (transport)', 'ngồi; đi (xe)', '我坐地铁上学。', 'Wǒ zuò dìtiě shàngxué.', 'I take the subway to school.', 'Tôi đi tàu điện ngầm đến trường.'),
  zh('医院', 'yīyuàn', 'Y viện', 'noun', 'hospital', 'bệnh viện', '他在医院工作。', 'Tā zài yīyuàn gōngzuò.', 'He works at a hospital.', 'Anh ấy làm việc ở bệnh viện.'),
  zh('身体', 'shēntǐ', 'Thân thể', 'noun', 'body, health', 'cơ thể, sức khỏe', '你身体好吗？', 'Nǐ shēntǐ hǎo ma?', 'Are you in good health?', 'Bạn có khỏe không?'),
  zh('累', 'lèi', 'Lụy', 'adjective', 'tired', 'mệt', '今天我很累。', 'Jīntiān wǒ hěn lèi.', 'I am very tired today.', 'Hôm nay tôi rất mệt.'),
  zh('忙', 'máng', 'Mang', 'adjective', 'busy', 'bận', '你最近忙吗？', 'Nǐ zuìjìn máng ma?', 'Have you been busy lately?', 'Dạo này bạn có bận không?'),
  zh('冷', 'lěng', 'Lãnh', 'adjective', 'cold', 'lạnh', '冬天很冷。', 'Dōngtiān hěn lěng.', 'Winter is very cold.', 'Mùa đông rất lạnh.'),
  zh('热', 'rè', 'Nhiệt', 'adjective', 'hot', 'nóng', '今天太热了。', 'Jīntiān tài rè le.', 'It is too hot today.', 'Hôm nay nóng quá.'),
  zh('东西', 'dōngxi', 'Đông tây', 'noun', 'thing, stuff', 'đồ vật', '你买了什么东西？', 'Nǐ mǎi le shénme dōngxi?', 'What did you buy?', 'Bạn đã mua những gì?'),
  zh('电影', 'diànyǐng', 'Điện ảnh', 'noun', 'film', 'phim', '周末我们去看电影。', 'Zhōumò wǒmen qù kàn diànyǐng.', "We'll go to the movies at the weekend.", 'Cuối tuần chúng tôi đi xem phim.'),
  zh('音乐', 'yīnyuè', 'Âm nhạc', 'noun', 'music', 'âm nhạc', '我喜欢听音乐。', 'Wǒ xǐhuan tīng yīnyuè.', 'I like listening to music.', 'Tôi thích nghe nhạc.'),
  zh('写', 'xiě', 'Tả', 'verb', 'to write', 'viết', '请写你的名字。', 'Qǐng xiě nǐ de míngzi.', 'Please write your name.', 'Vui lòng viết tên của bạn.'),
  zh('听', 'tīng', 'Thính', 'verb', 'to listen', 'nghe', '请听老师说。', 'Qǐng tīng lǎoshī shuō.', 'Please listen to the teacher.', 'Hãy nghe thầy giáo nói.'),
  zh('懂', 'dǒng', 'Đổng', 'verb', 'to understand', 'hiểu', '你懂我的意思吗？', 'Nǐ dǒng wǒ de yìsi ma?', 'Do you understand what I mean?', 'Bạn hiểu ý tôi không?'),
  zh('知道', 'zhīdào', 'Tri đạo', 'verb', 'to know', 'biết', '我不知道。', 'Wǒ bù zhīdào.', "I don't know.", 'Tôi không biết.'),
  zh('觉得', 'juéde', 'Giác đắc', 'verb', 'to feel, to think', 'cảm thấy', '我觉得中文很有意思。', 'Wǒ juéde Zhōngwén hěn yǒu yìsi.', 'I think Chinese is interesting.', 'Tôi thấy tiếng Trung rất thú vị.'),
  zh('希望', 'xīwàng', 'Hy vọng', 'verb', 'to hope', 'hy vọng', '希望你考试顺利。', 'Xīwàng nǐ kǎoshì shùnlì.', 'I hope your exam goes well.', 'Chúc bạn thi tốt.'),
  zh('准备', 'zhǔnbèi', 'Chuẩn bị', 'verb', 'to prepare', 'chuẩn bị', '我在准备考试。', 'Wǒ zài zhǔnbèi kǎoshì.', 'I am preparing for an exam.', 'Tôi đang chuẩn bị cho kỳ thi.'),
  zh('开始', 'kāishǐ', 'Khai thủy', 'verb', 'to begin', 'bắt đầu', '上课开始了。', 'Shàngkè kāishǐ le.', 'Class has started.', 'Giờ học bắt đầu rồi.'),
  zh('帮助', 'bāngzhù', 'Bang trợ', 'verb', 'to help', 'giúp đỡ', '朋友常常帮助我。', 'Péngyou chángcháng bāngzhù wǒ.', 'My friends often help me.', 'Bạn bè thường giúp đỡ tôi.'),
  zh('一起', 'yìqǐ', 'Nhất khởi', 'adverb', 'together', 'cùng nhau', '我们一起学习吧。', 'Wǒmen yìqǐ xuéxí ba.', "Let's study together.", 'Chúng ta cùng học nhé.'),
  zh('已经', 'yǐjīng', 'Dĩ kinh', 'adverb', 'already', 'đã', '我已经吃饭了。', 'Wǒ yǐjīng chī fàn le.', 'I have already eaten.', 'Tôi đã ăn cơm rồi.'),
  zh('非常', 'fēicháng', 'Phi thường', 'adverb', 'very, extremely', 'vô cùng', '这本书非常有用。', 'Zhè běn shū fēicháng yǒuyòng.', 'This book is extremely useful.', 'Cuốn sách này vô cùng hữu ích.'),
  zh('容易', 'róngyì', 'Dung dị', 'adjective', 'easy', 'dễ', '这个问题很容易。', 'Zhège wèntí hěn róngyì.', 'This question is easy.', 'Câu hỏi này rất dễ.'),
  zh('难', 'nán', 'Nan', 'adjective', 'difficult', 'khó', '汉字不难。', 'Hànzì bù nán.', 'Chinese characters are not hard.', 'Chữ Hán không khó.'),
  zh('快', 'kuài', 'Khoái', 'adjective', 'fast', 'nhanh', '他跑得很快。', 'Tā pǎo de hěn kuài.', 'He runs fast.', 'Anh ấy chạy rất nhanh.'),
  zh('慢', 'màn', 'Mạn', 'adjective', 'slow', 'chậm', '请说慢一点。', 'Qǐng shuō màn yìdiǎn.', 'Please speak a bit slower.', 'Xin nói chậm một chút.'),
  zh('新', 'xīn', 'Tân', 'adjective', 'new', 'mới', '这是我的新电脑。', 'Zhè shì wǒ de xīn diànnǎo.', 'This is my new computer.', 'Đây là máy tính mới của tôi.'),
  zh('旁边', 'pángbiān', 'Bàng biên', 'noun', 'beside', 'bên cạnh', '银行在学校旁边。', 'Yínháng zài xuéxiào pángbiān.', 'The bank is next to the school.', 'Ngân hàng ở bên cạnh trường.'),
  zh('房间', 'fángjiān', 'Phòng gian', 'noun', 'room', 'phòng', '我的房间很干净。', 'Wǒ de fángjiān hěn gānjìng.', 'My room is very clean.', 'Phòng của tôi rất sạch.'),
  zh('运动', 'yùndòng', 'Vận động', 'verb', 'to exercise', 'tập thể dục', '我每天运动半个小时。', 'Wǒ měitiān yùndòng bàn gè xiǎoshí.', 'I exercise half an hour a day.', 'Mỗi ngày tôi tập thể dục nửa tiếng.'),
  zh('旅游', 'lǚyóu', 'Lữ du', 'verb', 'to travel', 'du lịch', '暑假我想去北京旅游。', 'Shǔjià wǒ xiǎng qù Běijīng lǚyóu.', 'I want to travel to Beijing in the summer holidays.', 'Kỳ nghỉ hè tôi muốn đi du lịch Bắc Kinh.'),
  zh('生日', 'shēngrì', 'Sinh nhật', 'noun', 'birthday', 'sinh nhật', '祝你生日快乐！', 'Zhù nǐ shēngrì kuàilè!', 'Happy birthday!', 'Chúc mừng sinh nhật bạn!'),
  zh('意思', 'yìsi', 'Ý tư', 'noun', 'meaning', 'ý nghĩa', '这个词是什么意思？', 'Zhège cí shì shénme yìsi?', 'What does this word mean?', 'Từ này nghĩa là gì?'),
]

export const ES_BANK: W[] = [
  es('el nombre', '/el ˈnom.bɾe/', 'noun (m)', 'name', 'tên', '¿Cuál es tu nombre?', 'What is your name?', 'Tên bạn là gì?'),
  es('¿qué?', '/ke/', 'pronoun', 'what?', 'cái gì?', '¿Qué estudias?', 'What do you study?', 'Bạn học gì?'),
  es('¿dónde?', '/ˈdon.de/', 'adverb', 'where?', 'ở đâu?', '¿Dónde está la biblioteca?', 'Where is the library?', 'Thư viện ở đâu?'),
  es('¿cómo?', '/ˈko.mo/', 'adverb', 'how?', 'thế nào?', '¿Cómo se dice esto en español?', 'How do you say this in Spanish?', 'Cái này tiếng Tây Ban Nha nói thế nào?'),
  es('¿por qué?', '/poɾ ˈke/', 'adverb', 'why?', 'tại sao?', '¿Por qué aprendes español?', 'Why are you learning Spanish?', 'Tại sao bạn học tiếng Tây Ban Nha?'),
  es('ahora', '/aˈo.ɾa/', 'adverb', 'now', 'bây giờ', 'Ahora estoy en clase.', "I'm in class now.", 'Bây giờ tôi đang ở lớp.'),
  es('ayer', '/aˈʝeɾ/', 'adverb', 'yesterday', 'hôm qua', 'Ayer estudié mucho.', 'I studied a lot yesterday.', 'Hôm qua tôi học rất nhiều.'),
  es('la mañana', '/la maˈɲa.na/', 'noun (f)', 'morning', 'buổi sáng', 'Me levanto temprano por la mañana.', 'I get up early in the morning.', 'Tôi dậy sớm vào buổi sáng.'),
  es('la noche', '/la ˈno.tʃe/', 'noun (f)', 'night', 'buổi tối, đêm', 'Leo un poco cada noche.', 'I read a little every night.', 'Mỗi tối tôi đọc một chút.'),
  es('la semana', '/la seˈma.na/', 'noun (f)', 'week', 'tuần', 'Tengo tres exámenes esta semana.', 'I have three exams this week.', 'Tuần này tôi có ba bài thi.'),
  es('la escuela', '/la esˈkwe.la/', 'noun (f)', 'school', 'trường học', 'La escuela está cerca de mi casa.', 'The school is near my house.', 'Trường ở gần nhà tôi.'),
  es('la universidad', '/la u.ni.βeɾ.siˈðað/', 'noun (f)', 'university', 'đại học', 'Estudio economía en la universidad.', 'I study economics at university.', 'Tôi học kinh tế ở đại học.'),
  es('el examen', '/el ekˈsa.men/', 'noun (m)', 'exam', 'bài thi', 'Mañana tengo un examen.', 'I have an exam tomorrow.', 'Ngày mai tôi có bài thi.'),
  es('la pregunta', '/la pɾeˈɣun.ta/', 'noun (f)', 'question', 'câu hỏi', 'Tengo una pregunta.', 'I have a question.', 'Tôi có một câu hỏi.'),
  es('los deberes', '/los deˈβe.ɾes/', 'noun (m pl)', 'homework', 'bài tập về nhà', 'Primero hago los deberes.', 'First I do my homework.', 'Tôi làm bài tập trước.'),
  es('la biblioteca', '/la βi.βljoˈte.ka/', 'noun (f)', 'library', 'thư viện', 'Nos vemos en la biblioteca.', 'See you at the library.', 'Gặp nhau ở thư viện nhé.'),
  es('el móvil', '/el ˈmo.βil/', 'noun (m)', 'mobile phone', 'điện thoại', 'Mi móvil no tiene batería.', 'My phone has no battery.', 'Điện thoại tôi hết pin.'),
  es('comprar', '/komˈpɾaɾ/', 'verb', 'to buy', 'mua', 'Quiero comprar un libro.', 'I want to buy a book.', 'Tôi muốn mua một cuốn sách.'),
  es('la tienda', '/la ˈtjen.da/', 'noun (f)', 'shop', 'cửa hàng', 'La tienda abre a las nueve.', 'The shop opens at nine.', 'Cửa hàng mở lúc chín giờ.'),
  es('el arroz', '/el aˈroθ/', 'noun (m)', 'rice', 'cơm, gạo', 'Como arroz casi todos los días.', 'I eat rice almost every day.', 'Tôi ăn cơm gần như mỗi ngày.'),
  es('el té', '/el te/', 'noun (m)', 'tea', 'trà', '¿Quieres un té?', 'Would you like a tea?', 'Bạn muốn uống trà không?'),
  es('el café', '/el kaˈfe/', 'noun (m)', 'coffee', 'cà phê', 'Tomo un café por la mañana.', 'I have a coffee in the morning.', 'Buổi sáng tôi uống một ly cà phê.'),
  es('la fruta', '/la ˈfɾu.ta/', 'noun (f)', 'fruit', 'trái cây', 'La fruta es buena para la salud.', 'Fruit is good for your health.', 'Trái cây tốt cho sức khỏe.'),
  es('rico', '/ˈri.ko/', 'adjective', 'tasty (also rich)', 'ngon (cũng: giàu)', '¡Esta sopa está muy rica!', 'This soup is really tasty!', 'Món súp này ngon quá!'),
  es('ir', '/iɾ/', 'verb', 'to go', 'đi', 'Vamos al parque.', "Let's go to the park.", 'Chúng ta đi công viên nào.'),
  es('venir', '/beˈniɾ/', 'verb', 'to come', 'đến', '¿Cuándo vienes?', 'When are you coming?', 'Khi nào bạn đến?'),
  es('volver', '/bolˈβeɾ/', 'verb', 'to return', 'quay về', 'Vuelvo a casa a las seis.', 'I get home at six.', 'Tôi về nhà lúc sáu giờ.'),
  es('sentarse', '/senˈtaɾ.se/', 'verb', 'to sit down', 'ngồi xuống', 'Siéntate aquí, por favor.', 'Sit here, please.', 'Mời bạn ngồi đây.'),
  es('el hospital', '/el os.piˈtal/', 'noun (m)', 'hospital', 'bệnh viện', 'Mi madre trabaja en un hospital.', 'My mother works in a hospital.', 'Mẹ tôi làm việc ở bệnh viện.'),
  es('la salud', '/la saˈluð/', 'noun (f)', 'health', 'sức khỏe', 'Dormir bien es importante para la salud.', 'Sleeping well is important for your health.', 'Ngủ ngon rất quan trọng cho sức khỏe.'),
  es('cansado', '/kanˈsa.ðo/', 'adjective', 'tired', 'mệt', 'Hoy estoy muy cansado.', 'I am very tired today.', 'Hôm nay tôi rất mệt.'),
  es('ocupado', '/o.kuˈpa.ðo/', 'adjective', 'busy', 'bận', '¿Estás ocupada esta tarde?', 'Are you busy this afternoon?', 'Chiều nay bạn có bận không?'),
  es('el frío', '/el ˈfɾi.o/', 'noun (m)', 'cold', 'cái lạnh', 'Hace mucho frío en invierno.', 'It is very cold in winter.', 'Mùa đông trời rất lạnh.'),
  es('el calor', '/el kaˈloɾ/', 'noun (m)', 'heat', 'cái nóng', 'Hoy hace demasiado calor.', 'It is too hot today.', 'Hôm nay nóng quá.'),
  es('la cosa', '/la ˈko.sa/', 'noun (f)', 'thing', 'đồ vật, điều', 'Tengo muchas cosas que hacer.', 'I have many things to do.', 'Tôi có nhiều việc phải làm.'),
  es('la película', '/la peˈli.ku.la/', 'noun (f)', 'film', 'bộ phim', 'Vemos una película el sábado.', "We're watching a film on Saturday.", 'Thứ bảy chúng tôi xem phim.'),
  es('la música', '/la ˈmu.si.ka/', 'noun (f)', 'music', 'âm nhạc', 'Me gusta escuchar música.', 'I like listening to music.', 'Tôi thích nghe nhạc.'),
  es('escribir', '/es.kɾiˈβiɾ/', 'verb', 'to write', 'viết', 'Escribe tu nombre aquí.', 'Write your name here.', 'Viết tên bạn ở đây.'),
  es('escuchar', '/es.kuˈtʃaɾ/', 'verb', 'to listen', 'nghe', 'Escucha a la profesora.', 'Listen to the teacher.', 'Hãy nghe cô giáo.'),
  es('saber', '/saˈβeɾ/', 'verb', 'to know (facts)', 'biết', 'No lo sé.', "I don't know.", 'Tôi không biết.'),
  es('creer', '/kɾeˈeɾ/', 'verb', 'to believe, to think', 'tin, nghĩ', 'Creo que el español es fácil.', 'I think Spanish is easy.', 'Tôi nghĩ tiếng Tây Ban Nha dễ.'),
  es('esperar', '/es.peˈɾaɾ/', 'verb', 'to hope; to wait', 'hy vọng; chờ', 'Espero aprobar el examen.', 'I hope to pass the exam.', 'Tôi hy vọng thi đỗ.'),
  es('preparar', '/pɾe.paˈɾaɾ/', 'verb', 'to prepare', 'chuẩn bị', 'Estoy preparando la presentación.', "I'm preparing the presentation.", 'Tôi đang chuẩn bị bài thuyết trình.'),
  es('empezar', '/em.peˈθaɾ/', 'verb', 'to begin', 'bắt đầu', 'La clase empieza a las diez.', 'Class starts at ten.', 'Lớp học bắt đầu lúc mười giờ.'),
  es('ayudar', '/a.ʝuˈðaɾ/', 'verb', 'to help', 'giúp', '¿Me puedes ayudar?', 'Can you help me?', 'Bạn giúp tôi được không?'),
  es('juntos', '/ˈxun.tos/', 'adverb', 'together', 'cùng nhau', 'Estudiamos juntos los martes.', 'We study together on Tuesdays.', 'Thứ ba chúng tôi học cùng nhau.'),
  es('ya', '/ʝa/', 'adverb', 'already', 'đã, rồi', 'Ya he comido.', 'I have already eaten.', 'Tôi ăn rồi.'),
  es('muy', '/mui/', 'adverb', 'very', 'rất', 'Este libro es muy útil.', 'This book is very useful.', 'Cuốn sách này rất hữu ích.'),
  es('fácil', '/ˈfa.θil/', 'adjective', 'easy', 'dễ', 'La pregunta es fácil.', 'The question is easy.', 'Câu hỏi này dễ.'),
  es('difícil', '/diˈfi.θil/', 'adjective', 'difficult', 'khó', 'La gramática no es difícil.', 'Grammar is not difficult.', 'Ngữ pháp không khó.'),
  es('rápido', '/ˈra.pi.ðo/', 'adjective', 'fast', 'nhanh', 'Habla muy rápido.', 'He speaks very fast.', 'Anh ấy nói rất nhanh.'),
  es('despacio', '/desˈpa.θjo/', 'adverb', 'slowly', 'chậm', 'Habla más despacio, por favor.', 'Speak more slowly, please.', 'Làm ơn nói chậm hơn.'),
  es('nuevo', '/ˈnwe.βo/', 'adjective', 'new', 'mới', 'Este es mi ordenador nuevo.', 'This is my new computer.', 'Đây là máy tính mới của tôi.'),
  es('al lado de', '/al ˈla.ðo de/', 'preposition', 'next to', 'bên cạnh', 'El banco está al lado de la escuela.', 'The bank is next to the school.', 'Ngân hàng ở cạnh trường.'),
  es('la habitación', '/la a.βi.taˈθjon/', 'noun (f)', 'room', 'phòng', 'Mi habitación está limpia.', 'My room is clean.', 'Phòng tôi sạch sẽ.'),
  es('hacer deporte', '/aˈθeɾ deˈpoɾ.te/', 'phrase', 'to exercise', 'tập thể thao', 'Hago deporte media hora al día.', 'I exercise half an hour a day.', 'Tôi tập thể thao nửa tiếng mỗi ngày.'),
  es('viajar', '/bjaˈxaɾ/', 'verb', 'to travel', 'đi du lịch', 'En verano quiero viajar a México.', 'In summer I want to travel to Mexico.', 'Mùa hè tôi muốn đi du lịch Mexico.'),
  es('el cumpleaños', '/el kum.pleˈa.ɲos/', 'noun (m)', 'birthday', 'sinh nhật', '¡Feliz cumpleaños!', 'Happy birthday!', 'Chúc mừng sinh nhật!'),
  es('significar', '/siɣ.ni.fiˈkaɾ/', 'verb', 'to mean', 'có nghĩa là', '¿Qué significa esta palabra?', 'What does this word mean?', 'Từ này nghĩa là gì?'),
  es('el mundo', '/el ˈmun.do/', 'noun (m)', 'world', 'thế giới', 'Quiero viajar por todo el mundo.', 'I want to travel all over the world.', 'Tôi muốn đi khắp thế giới.'),
]

export type BankWord = W & { level: number }
type Row = [string, string | null, string | null, string, string, string, number]

/** Hand-written words (with example sentences) first, then the full list: HSK 3.0 bands 1–2 / CEFR A1–A2, level by level. */
export function mergeBank(curated: W[], rows: Row[]): BankWord[] {
  const out: BankWord[] = [], seen = new Set<string>()
  const add = (w: W, level: number) => { if (seen.has(w.term)) return; seen.add(w.term); out.push({ ...w, level }) }
  const lvl = new Map(rows.map((r) => [r[0], r[6]]))
  for (const w of curated) add(w, lvl.get(w.term) ?? 1)
  for (const [term, reading, hanviet, pos, meaning_en, meaning_vi, level] of [...rows].sort((a, b) => a[6] - b[6]))
    add({ term, reading, hanviet, pos, meaning_en, meaning_vi, example: null, example_reading: null, example_en: null, example_vi: null }, level)
  return out.sort((a, b) => a.level - b.level)
}

const cache = new Map<string, Promise<BankWord[]>>()
/** The whole bank for a language (fetched once, then cached; falls back to the hand-written words offline). */
export function loadBank(lang: 'zh' | 'es', get: (url: string) => Promise<Row[]> = (u) => fetch(u).then((r) => r.json())): Promise<BankWord[]> {
  if (!cache.has(lang)) cache.set(lang, get(lang === 'zh' ? '/vocab/zh-hsk.json' : '/vocab/es-cefr.json')
    .then((rows) => mergeBank(lang === 'zh' ? ZH_BANK : ES_BANK, rows))
    .catch(() => { cache.delete(lang); return mergeBank(lang === 'zh' ? ZH_BANK : ES_BANK, []) }))
  return cache.get(lang)!
}

/** The next `n` bank words this deck doesn't have yet (lowest level first). */
export const nextBatch = (bank: BankWord[], have: Set<string>, n = 20): BankWord[] => bank.filter((w) => !have.has(w.term)).slice(0, n)
/** Progress per level: how many of each level's words are in the deck. */
export const levelProgress = (bank: BankWord[], have: Set<string>) => [...new Set(bank.map((w) => w.level))].map((level) => {
  const all = bank.filter((w) => w.level === level); return { level, total: all.length, have: all.filter((w) => have.has(w.term)).length }
})
